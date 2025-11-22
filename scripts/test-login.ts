/**
 * 测试用户登录
 * Test User Login
 * 
 * 使用方法:
 * npx tsx scripts/test-login.ts <email> <password>
 * 
 * 示例:
 * npx tsx scripts/test-login.ts sean.li@smtengo.com YourPassword123!
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
import { verifyUserPassword } from '../lib/credentials'

const prisma = new PrismaClient()

async function testLogin(email: string, password: string) {
  console.log(`\n🔐 测试用户登录`)
  console.log('====================\n')
  console.log(`邮箱: ${email}`)
  console.log(`密码: ${'*'.repeat(password.length)}\n`)

  try {
    // 1. 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { credentials: true },
    })

    if (!user) {
      console.log('❌ 用户不存在')
      console.log(`   邮箱: ${email}`)
      return false
    }

    console.log('✅ 用户存在')
    console.log(`   ID: ${user.id}`)
    console.log(`   名称: ${user.name || '未设置'}\n`)

    // 2. 检查是否有凭证
    if (!user.credentials) {
      console.log('❌ 无凭证')
      console.log('   💡 这可能是登录失败的原因')
      console.log('   💡 需要创建 UserCredentials')
      return false
    }

    console.log('✅ 有凭证')
    console.log(`   凭证用户 ID: ${user.credentials.userId}`)
    console.log(`   匹配: ${user.credentials.userId === user.id ? '✅' : '❌'}\n`)

    // 3. 验证密码
    console.log('🔐 验证密码...')
    const isValidPassword = await verifyUserPassword(email, password)

    if (isValidPassword) {
      console.log('✅ 密码验证成功！')
      console.log('\n✅ 登录测试通过')
      console.log('====================')
      console.log(`用户: ${email}`)
      console.log(`状态: 可以登录`)
      return true
    } else {
      console.log('❌ 密码验证失败')
      console.log('\n❌ 登录测试失败')
      console.log('====================')
      console.log(`用户: ${email}`)
      console.log(`状态: 密码不正确`)
      console.log('\n💡 建议:')
      console.log('   1. 确认密码是否正确')
      console.log('   2. 如果需要重置密码，运行:')
      console.log(`      npx tsx scripts/reset-user-password.ts ${email} <new-password>`)
      return false
    }

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message)
    if (error.message.includes('DATABASE_URL')) {
      console.log('   💡 提示: 需要设置 DATABASE_URL 环境变量')
    }
    return false
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const email = process.argv[2]
  let password = process.argv[3]

  if (!email) {
    console.log('❌ 使用方法错误')
    console.log('')
    console.log('使用方法:')
    console.log('  npm run test:login <email> "<password>"')
    console.log('  或: npx tsx scripts/test-login.ts <email> "<password>"')
    console.log('')
    console.log('示例:')
    console.log('  npm run test:login sean.li@smtengo.com "YourPassword123!"')
    console.log('')
    console.log('💡 提示: 密码需要用引号包裹，特别是包含特殊字符时')
    console.log('')
    process.exit(1)
  }

  // 如果没有提供密码，提示用户输入（交互式）
  if (!password) {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    password = await new Promise<string>((resolve) => {
      rl.question('请输入密码: ', (answer: string) => {
        rl.close()
        resolve(answer)
      })
    })
  }

  const success = await testLogin(email, password)
  process.exit(success ? 0 : 1)
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})

