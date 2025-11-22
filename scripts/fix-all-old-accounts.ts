/**
 * 批量修复所有旧账户
 * Fix All Old Accounts
 * 
 * 使用方法:
 * npx tsx scripts/fix-all-old-accounts.ts
 * 
 * 注意: 此脚本只会创建 Household，不会创建 UserCredentials
 * 如果需要创建凭证，需要知道密码或使用密码重置脚本
 */

// Load environment variables from .env.local FIRST, before any other imports
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

// Verify DATABASE_URL is loaded BEFORE importing Prisma
if (!process.env.DATABASE_URL) {
  console.error('❌ 错误: DATABASE_URL 环境变量未设置')
  console.error('   请确保 .env.local 文件存在并包含 DATABASE_URL')
  console.error('   格式: DATABASE_URL="postgresql://user:password@host:port/database"')
  process.exit(1)
}

// Now import Prisma and other modules AFTER environment variables are loaded
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAllOldAccounts() {
  console.log('\n🔧 批量修复所有旧账户')
  console.log('====================\n')

  try {
    // 获取所有没有 Household 的用户
    const usersWithoutHousehold = await prisma.user.findMany({
      include: {
        householdMemberships: true,
      },
      where: {
        householdMemberships: {
          none: {},
        },
      },
    })

    console.log(`📊 找到 ${usersWithoutHousehold.length} 个没有 Household 的用户\n`)

    if (usersWithoutHousehold.length === 0) {
      console.log('✅ 所有用户都有 Household，无需修复\n')
      return
    }

    let fixedCount = 0
    let errorCount = 0

    for (const user of usersWithoutHousehold) {
      try {
        // 创建 Household
        const household = await prisma.household.create({
          data: {
            name: `${user.name || user.email.split('@')[0]}'s Household`,
            description: '自动创建的默认 Household',
          },
        })

        // 创建 HouseholdMember 关系（OWNER 角色）
        await prisma.householdMember.create({
          data: {
            userId: user.id,
            householdId: household.id,
            role: 'OWNER',
          },
        })

        console.log(`✅ 已为 ${user.email} 创建 Household: ${household.name}`)
        fixedCount++
      } catch (error: any) {
        console.error(`❌ 修复 ${user.email} 失败:`, error.message)
        errorCount++
      }
    }

    console.log('\n📊 修复结果:')
    console.log('====================')
    console.log(`成功: ${fixedCount}`)
    console.log(`失败: ${errorCount}`)
    console.log(`总计: ${usersWithoutHousehold.length}`)
    console.log('')

    // 检查 UserCredentials
    const usersWithoutCredentials = await prisma.user.findMany({
      where: {
        credentials: null,
      },
    })

    if (usersWithoutCredentials.length > 0) {
      console.log('⚠️  注意: 以下用户缺少 UserCredentials:')
      usersWithoutCredentials.forEach(user => {
        console.log(`   - ${user.email}`)
      })
      console.log('')
      console.log('💡 提示: 需要使用密码重置脚本来创建凭证:')
      console.log('   npm run reset:password <email> <password>')
      console.log('')
    }

  } catch (error: any) {
    console.error('❌ 修复失败:', error.message)
    if (error.message.includes('DATABASE_URL')) {
      console.log('   💡 提示: 需要设置 DATABASE_URL 环境变量')
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  await fixAllOldAccounts()
  console.log('✅ 修复完成')
  console.log('====================\n')
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})

