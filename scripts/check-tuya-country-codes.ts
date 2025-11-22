/**
 * 检查所有用户的 Tuya 国家代码
 * Check All Users' Tuya Country Codes
 * 
 * 使用方法:
 * npx tsx scripts/check-tuya-country-codes.ts
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

// 国家代码映射
const countryCodeMap: Record<string, string> = {
  '1': 'US (United States)',
  '86': 'CN (China)',
  '81': 'JP (Japan)',
  '65': 'SG (Singapore)',
  '852': 'HK (Hong Kong)',
  '886': 'TW (Taiwan)',
  '887': 'TW (Taiwan)',
}

async function checkTuyaCountryCodes() {
  console.log('\n🌍 检查所有用户的 Tuya 国家代码')
  console.log('====================\n')

  try {
    // 获取所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        tuyaAccount: true,
        tuyaCountryCode: true,
      },
      orderBy: {
        email: 'asc',
      },
    })

    console.log(`📊 总共找到 ${users.length} 个用户\n`)

    // 按国家代码分组统计
    const countryStats: Record<string, number> = {}

    console.log('📋 用户 Tuya 国家代码列表:')
    console.log('====================\n')

    users.forEach((user, index) => {
      const countryCode = user.tuyaCountryCode || '1' // 默认为 1 (US)
      const countryName = countryCodeMap[countryCode] || `Unknown (${countryCode})`
      
      // 统计
      countryStats[countryCode] = (countryStats[countryCode] || 0) + 1

      console.log(`${index + 1}. ${user.email}`)
      console.log(`   名称: ${user.name || '未设置'}`)
      console.log(`   Tuya 账户: ${user.tuyaAccount || '未设置'}`)
      console.log(`   国家代码: ${countryCode} - ${countryName}`)
      console.log('')
    })

    console.log('📊 国家代码统计:')
    console.log('====================')
    Object.entries(countryStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([code, count]) => {
        const countryName = countryCodeMap[code] || `Unknown (${code})`
        console.log(`   ${code} - ${countryName}: ${count} 个用户`)
      })
    console.log('')

    // 显示推断逻辑
    console.log('💡 国家代码推断逻辑:')
    console.log('====================')
    console.log('   - 默认: 887 (Taiwan)')
    console.log('   - 包含 .cn, @qq., @163.: 86 (China)')
    console.log('   - 包含 .jp: 81 (Japan)')
    console.log('   - 包含 .sg: 65 (Singapore)')
    console.log('')

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
  await checkTuyaCountryCodes()
  console.log('✅ 检查完成')
  console.log('====================\n')
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})

