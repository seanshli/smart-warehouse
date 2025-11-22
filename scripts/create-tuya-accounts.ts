/**
 * 批量创建 Tuya 账户
 * Batch Create Tuya Accounts
 * 
 * 使用方法:
 * npx tsx scripts/create-tuya-accounts.ts
 * 
 * 注意: 此脚本会为所有没有 Tuya 账户的用户创建账户
 * Tuya 账户会在用户首次使用 Tuya 功能时自动创建，此脚本用于提前创建
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
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * 生成随机密码
 */
function generateRandomPassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const randomBytes = crypto.randomBytes(length)
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }
  return password
}

/**
 * 生成 Tuya 账户名（基于用户邮箱）
 */
function generateTuyaAccount(email: string): string {
  // 使用邮箱前缀 + 随机后缀
  const emailPrefix = email.split('@')[0]
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${emailPrefix}_${randomSuffix}`
}

async function createTuyaAccounts() {
  console.log('\n🔧 批量创建 Tuya 账户')
  console.log('====================\n')

  try {
    // 获取所有没有 Tuya 账户的用户
    const usersWithoutTuya = await prisma.user.findMany({
      where: {
        tuyaAccount: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    console.log(`📊 找到 ${usersWithoutTuya.length} 个没有 Tuya 账户的用户\n`)

    if (usersWithoutTuya.length === 0) {
      console.log('✅ 所有用户都有 Tuya 账户，无需创建\n')
      return
    }

    let createdCount = 0
    let errorCount = 0

    for (const user of usersWithoutTuya) {
      try {
        // 生成 Tuya 账户和密码（与 auto-create API 保持一致）
        const { account, password, countryCode } = generateTuyaAccount(user.email)

        // 加密密码（与 auto-create API 保持一致）
        const salt = await bcrypt.genSalt(12)
        const encryptedPassword = await bcrypt.hash(password, salt)

        // 更新用户记录
        await prisma.user.update({
          where: { id: user.id },
          data: {
            tuyaAccount: account,
            tuyaPassword: encryptedPassword,
            tuyaCountryCode: countryCode,
          },
        })

        console.log(`✅ 已为 ${user.email} 创建 Tuya 账户: ${account}`)
        createdCount++
      } catch (error: any) {
        console.error(`❌ 为 ${user.email} 创建 Tuya 账户失败:`, error.message)
        errorCount++
      }
    }

    console.log('\n📊 创建结果:')
    console.log('====================')
    console.log(`成功: ${createdCount}`)
    console.log(`失败: ${errorCount}`)
    console.log(`总计: ${usersWithoutTuya.length}`)
    console.log('')

    console.log('💡 重要提示:')
    console.log('====================')
    console.log('1. Tuya 账户信息已生成并保存到数据库（密码已加密）')
    console.log('2. 实际创建 Tuya 账户需要在客户端（iOS/Android）通过 SDK 进行')
    console.log('3. 用户首次使用 Tuya 功能时，SDK 会自动注册账户')
    console.log('4. Token 会在用户首次登录 Tuya 时自动获取并保存')
    console.log('5. 这与 /api/user/tuya-account/auto-create API 的行为一致')
    console.log('')

  } catch (error: any) {
    console.error('❌ 创建失败:', error.message)
    if (error.message.includes('DATABASE_URL')) {
      console.log('   💡 提示: 需要设置 DATABASE_URL 环境变量')
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  await createTuyaAccounts()
  console.log('✅ 创建完成')
  console.log('====================\n')
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})

