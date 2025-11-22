/**
 * 检查所有旧账户的状态
 * Check All Old Accounts Status
 * 
 * 使用方法:
 * npx tsx scripts/check-all-old-accounts.ts
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

interface AccountStatus {
  email: string
  name: string | null
  createdAt: Date | null
  hasCredentials: boolean
  hasHousehold: boolean
  householdCount: number
  issues: string[]
}

async function checkAllOldAccounts() {
  console.log('\n🔍 检查所有旧账户状态')
  console.log('====================\n')

  try {
    // 获取所有用户
    const users = await prisma.user.findMany({
      include: {
        credentials: true,
        householdMemberships: {
          include: {
            household: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    console.log(`📊 总共找到 ${users.length} 个用户\n`)

    const accountStatuses: AccountStatus[] = []
    let totalIssues = 0

    for (const user of users) {
      const issues: string[] = []
      const hasCredentials = !!user.credentials
      const hasHousehold = user.householdMemberships.length > 0
      const householdCount = user.householdMemberships.length

      if (!hasCredentials) {
        issues.push('❌ 缺少 UserCredentials（必需）')
        totalIssues++
      }

      if (!hasHousehold) {
        issues.push('⚠️  没有 Household（可能影响某些功能）')
        totalIssues++
      }

      accountStatuses.push({
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        hasCredentials,
        hasHousehold,
        householdCount,
        issues,
      })
    }

    // 显示有问题的账户
    const accountsWithIssues = accountStatuses.filter(acc => acc.issues.length > 0)

    if (accountsWithIssues.length > 0) {
      console.log(`⚠️  发现 ${accountsWithIssues.length} 个账户有问题:\n`)
      
      accountsWithIssues.forEach((acc, index) => {
        console.log(`${index + 1}. ${acc.email}`)
        console.log(`   名称: ${acc.name || '未设置'}`)
        console.log(`   创建时间: ${acc.createdAt?.toLocaleString() || '未知'}`)
        console.log(`   凭证: ${acc.hasCredentials ? '✅' : '❌'}`)
        console.log(`   Household: ${acc.hasHousehold ? `✅ (${acc.householdCount})` : '❌'}`)
        console.log(`   问题:`)
        acc.issues.forEach(issue => console.log(`     ${issue}`))
        console.log('')
      })
    } else {
      console.log('✅ 所有账户都没有问题！\n')
    }

    // 统计信息
    console.log('📊 统计信息:')
    console.log('====================')
    console.log(`总用户数: ${users.length}`)
    console.log(`有凭证: ${accountStatuses.filter(acc => acc.hasCredentials).length}`)
    console.log(`无凭证: ${accountStatuses.filter(acc => !acc.hasCredentials).length}`)
    console.log(`有 Household: ${accountStatuses.filter(acc => acc.hasHousehold).length}`)
    console.log(`无 Household: ${accountStatuses.filter(acc => !acc.hasHousehold).length}`)
    console.log(`有问题: ${accountsWithIssues.length}`)
    console.log(`总问题数: ${totalIssues}`)
    console.log('')

    // 建议的修复步骤
    if (accountsWithIssues.length > 0) {
      console.log('💡 建议的修复步骤:')
      console.log('====================')
      console.log('')
      console.log('1. 运行批量修复脚本:')
      console.log('   npm run fix:all-old-accounts')
      console.log('')
      console.log('2. 或者在 Supabase SQL Editor 中运行:')
      console.log('   scripts/fix-all-old-accounts.sql')
      console.log('')
      console.log('3. 注意: 批量修复只会创建 Household，不会创建 UserCredentials')
      console.log('   如果需要创建凭证，需要知道密码或使用密码重置脚本')
      console.log('')
    }

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message)
    if (error.message.includes('DATABASE_URL')) {
      console.log('   💡 提示: 需要设置 DATABASE_URL 环境变量')
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  await checkAllOldAccounts()
  console.log('✅ 检查完成')
  console.log('====================\n')
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})

