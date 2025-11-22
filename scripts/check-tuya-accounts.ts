/**
 * 检查所有用户的 Tuya 账户状态
 * Check All Users' Tuya Account Status
 * 
 * 使用方法:
 * npx tsx scripts/check-tuya-accounts.ts
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

interface TuyaAccountStatus {
  email: string
  name: string | null
  createdAt: Date | null
  hasTuyaAccount: boolean
  hasTuyaPassword: boolean
  hasTuyaToken: boolean
  tokenExpired: boolean
  issues: string[]
}

async function checkTuyaAccounts() {
  console.log('\n🔍 检查所有用户的 Tuya 账户状态')
  console.log('====================\n')

  try {
    // 获取所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        tuyaAccount: true,
        tuyaPassword: true,
        tuyaAccessToken: true,
        tuyaTokenExpiresAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    console.log(`📊 总共找到 ${users.length} 个用户\n`)

    const accountStatuses: TuyaAccountStatus[] = []
    let totalIssues = 0

    for (const user of users) {
      const issues: string[] = []
      const hasTuyaAccount = !!user.tuyaAccount
      const hasTuyaPassword = !!user.tuyaPassword
      const hasTuyaToken = !!user.tuyaAccessToken
      
      // 检查 token 是否过期
      const tokenExpired = user.tuyaTokenExpiresAt 
        ? new Date(user.tuyaTokenExpiresAt) < new Date()
        : false

      if (!hasTuyaAccount) {
        issues.push('⚠️  没有 Tuya 账户')
        totalIssues++
      }

      if (hasTuyaAccount && !hasTuyaPassword) {
        issues.push('⚠️  有 Tuya 账户但没有密码')
        totalIssues++
      }

      if (hasTuyaToken && tokenExpired) {
        issues.push('⚠️  Tuya Token 已过期')
        totalIssues++
      }

      accountStatuses.push({
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        hasTuyaAccount,
        hasTuyaPassword,
        hasTuyaToken,
        tokenExpired,
        issues,
      })
    }

    // 显示有问题的账户
    const accountsWithIssues = accountStatuses.filter(acc => acc.issues.length > 0)
    const accountsWithoutTuya = accountStatuses.filter(acc => !acc.hasTuyaAccount)

    if (accountsWithoutTuya.length > 0) {
      console.log(`⚠️  发现 ${accountsWithoutTuya.length} 个用户没有 Tuya 账户:\n`)
      
      accountsWithoutTuya.forEach((acc, index) => {
        console.log(`${index + 1}. ${acc.email}`)
        console.log(`   名称: ${acc.name || '未设置'}`)
        console.log(`   创建时间: ${acc.createdAt?.toLocaleString() || '未知'}`)
        console.log(`   Tuya 账户: ❌`)
        console.log('')
      })
    }

    if (accountsWithIssues.length > 0 && accountsWithIssues.length > accountsWithoutTuya.length) {
      console.log(`\n⚠️  其他问题:\n`)
      
      accountsWithIssues
        .filter(acc => acc.hasTuyaAccount) // 只显示有账户但有问题的情况
        .forEach((acc, index) => {
          console.log(`${index + 1}. ${acc.email}`)
          acc.issues.forEach(issue => console.log(`   ${issue}`))
          console.log('')
        })
    }

    if (accountsWithIssues.length === 0) {
      console.log('✅ 所有用户都有 Tuya 账户且配置正确！\n')
    }

    // 统计信息
    console.log('📊 统计信息:')
    console.log('====================')
    console.log(`总用户数: ${users.length}`)
    console.log(`有 Tuya 账户: ${accountStatuses.filter(acc => acc.hasTuyaAccount).length}`)
    console.log(`无 Tuya 账户: ${accountsWithoutTuya.length}`)
    console.log(`有 Tuya Token: ${accountStatuses.filter(acc => acc.hasTuyaToken).length}`)
    console.log(`Token 已过期: ${accountStatuses.filter(acc => acc.tokenExpired).length}`)
    console.log(`有问题: ${accountsWithIssues.length}`)
    console.log(`总问题数: ${totalIssues}`)
    console.log('')

    // 建议的修复步骤
    if (accountsWithoutTuya.length > 0) {
      console.log('💡 建议的修复步骤:')
      console.log('====================')
      console.log('')
      console.log('1. 运行批量创建 Tuya 账户脚本:')
      console.log('   npm run create:tuya-accounts')
      console.log('')
      console.log('2. 注意: Tuya 账户会在用户首次使用 Tuya 功能时自动创建')
      console.log('   如果需要提前创建，可以运行批量创建脚本')
      console.log('')
      console.log('3. Tuya 账户创建后，用户首次登录 Tuya 时会自动获取 Token')
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
  await checkTuyaAccounts()
  console.log('✅ 检查完成')
  console.log('====================\n')
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})

