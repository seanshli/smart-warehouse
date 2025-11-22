/**
 * 检查旧账户登录问题
 * Check Old Account Login Issues
 * 
 * 使用方法:
 * npx tsx scripts/check-old-account-issues.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Load .env.local file first (highest priority)
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

if (existsSync(envLocalPath)) {
  const result = config({ path: envLocalPath, override: true })
  if (result.error) {
    console.warn('⚠️  警告: 无法加载 .env.local:', result.error.message)
  }
} else if (existsSync(envPath)) {
  const result = config({ path: envPath, override: true })
  if (result.error) {
    console.warn('⚠️  警告: 无法加载 .env:', result.error.message)
  }
} else {
  console.warn('⚠️  警告: 未找到 .env.local 或 .env 文件')
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ 错误: DATABASE_URL 环境变量未设置')
  console.error('   请确保 .env.local 文件存在并包含 DATABASE_URL')
  console.error('   格式: DATABASE_URL="postgresql://user:password@host:port/database"')
  process.exit(1)
}

import { PrismaClient } from '@prisma/client'
import { verifyUserPassword } from '../lib/credentials'

const prisma = new PrismaClient()

async function checkOldAccount(email: string) {
  console.log(`\n🔍 检查账户: ${email}`)
  console.log('====================\n')

  try {
    // 1. 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        credentials: true,
        householdMemberships: true, // 作为 member (通过 HouseholdMember)
        communityMemberships: true,
      },
    })

    if (!user) {
      console.log('❌ 用户不存在')
      return
    }

    console.log('✅ 用户存在')
    console.log(`   ID: ${user.id}`)
    console.log(`   邮箱: ${user.email}`)
    console.log(`   名称: ${user.name || '未设置'}`)
    console.log(`   创建时间: ${user.createdAt?.toLocaleString() || '未知'}`)

    // 2. 检查凭证
    console.log('\n📝 凭证状态:')
    if (user.credentials) {
      console.log('   ✅ 有凭证')
      console.log(`   凭证用户 ID: ${user.credentials.userId}`)
      console.log(`   匹配: ${user.credentials.userId === user.id ? '✅' : '❌'}`)
    } else {
      console.log('   ❌ 无凭证')
      console.log('   💡 这可能是登录失败的原因')
    }

    // 3. 检查 Household
    console.log('\n🏠 Household 状态:')
    if (user.householdMemberships && user.householdMemberships.length > 0) {
      console.log(`   ✅ 有 ${user.householdMemberships.length} 个 Household 成员关系`)
      
      // 获取每个 Household 的详细信息
      const householdIds = user.householdMemberships.map(hm => hm.householdId)
      const households = await prisma.household.findMany({
        where: { id: { in: householdIds } },
      })
      
      households.forEach((h, i) => {
        const membership = user.householdMemberships.find(hm => hm.householdId === h.id)
        const role = membership?.role || 'UNKNOWN'
        console.log(`      ${i + 1}. ${h.name} (ID: ${h.id}, 角色: ${role})`)
      })
      
      // 检查是否有 OWNER 角色
      const ownerMemberships = user.householdMemberships.filter(hm => hm.role === 'OWNER')
      if (ownerMemberships.length > 0) {
        console.log(`   ✅ 有 ${ownerMemberships.length} 个 Household（作为 owner）`)
      } else {
        console.log('   ⚠️  没有作为 owner 的 Household')
      }
    } else {
      console.log('   ⚠️  无 Household 成员关系')
    }

    // 4. 检查 Community
    console.log('\n🏘️  Community 状态:')
    if (user.communityMemberships && user.communityMemberships.length > 0) {
      console.log(`   ✅ 有 ${user.communityMemberships.length} 个 Community 成员关系`)
    } else {
      console.log('   ⚠️  无 Community 成员关系（这是正常的，Community 是可选的）')
    }

    // 5. 测试密码验证（如果知道密码）
    console.log('\n🔐 密码验证:')
    if (user.credentials) {
      console.log('   ⚠️  无法测试密码验证（需要密码）')
      console.log('   💡 如果登录失败，可能是密码不正确')
    } else {
      console.log('   ❌ 无凭证，无法验证密码')
    }

    // 6. 检查可能的问题
    console.log('\n🔍 问题诊断:')
    const issues: string[] = []

    if (!user.credentials) {
      issues.push('❌ 缺少 UserCredentials（必需）')
    }

    if (!user.householdMemberships || user.householdMemberships.length === 0) {
      issues.push('⚠️  没有 Household（可能影响某些功能）')
    }

    if (issues.length > 0) {
      console.log('   发现的问题:')
      issues.forEach(issue => console.log(`   ${issue}`))
    } else {
      console.log('   ✅ 未发现明显问题')
    }

    // 7. 建议的修复步骤
    console.log('\n💡 建议的修复步骤:')
    if (!user.credentials) {
      console.log('   1. 创建 UserCredentials:')
      console.log(`      INSERT INTO "UserCredentials" ("userId", password, "createdAt", "updatedAt")`)
      console.log(`      SELECT id, '$2a$12$...', NOW(), NOW()`)
      console.log(`      FROM "User" WHERE email = '${email.toLowerCase()}'`)
      console.log(`      ON CONFLICT ("userId") DO NOTHING;`)
      console.log('   💡 注意: 需要知道密码才能创建凭证，或使用 bcrypt 生成新密码哈希')
    }

    if (!user.householdMemberships || user.householdMemberships.length === 0) {
      console.log('   2. 创建默认 Household:')
      console.log('   在 Supabase SQL Editor 中运行:')
      console.log('   scripts/fix-old-accounts-login.sql')
      console.log('   或使用以下 SQL:')
      console.log(`      -- 创建 Household 和 HouseholdMember 关系`)
      console.log(`      -- 详见 scripts/fix-old-accounts-login.sql`)
    }

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message)
    if (error.message.includes('DATABASE_URL')) {
      console.log('   💡 提示: 需要设置 DATABASE_URL 环境变量')
      console.log('')
      console.log('   解决方法:')
      console.log('   1. 创建 .env.local 文件（如果不存在）')
      console.log('   2. 添加 DATABASE_URL 环境变量')
      console.log('   3. 格式: DATABASE_URL="postgresql://user:password@host:port/database"')
      console.log('')
      console.log('   或者直接在命令行设置:')
      console.log('   export DATABASE_URL="your-database-url"')
      console.log('   npm run check:old-account sean.li@smtengo.com')
      console.log('')
      console.log('   或者使用 Supabase 连接字符串:')
      console.log('   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"')
    }
  }
}

async function main() {
  const email = process.argv[2] || 'sean.li@smtengo.com'
  
  console.log('🔍 旧账户登录问题检查')
  console.log('====================\n')
  console.log(`检查账户: ${email}\n`)

  await checkOldAccount(email)

  console.log('\n\n✅ 检查完成')
  console.log('====================')
  console.log('\n📝 下一步:')
  console.log('  1. 如果缺少凭证，需要创建 UserCredentials')
  console.log('  2. 如果缺少 Household，运行修复脚本')
  console.log('  3. 测试登录功能')
  
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})

