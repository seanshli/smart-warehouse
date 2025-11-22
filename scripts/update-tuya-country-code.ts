/**
 * 批量更新用户的 Tuya 国家代码
 * Batch Update Users' Tuya Country Code
 * 
 * 使用方法:
 * npx tsx scripts/update-tuya-country-code.ts <country-code>
 * 
 * 示例:
 * npx tsx scripts/update-tuya-country-code.ts 887
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

async function updateTuyaCountryCode(countryCode: string) {
  console.log(`\n🌍 批量更新 Tuya 国家代码`)
  console.log('====================\n')
  console.log(`目标国家代码: ${countryCode}`)
  console.log('')

  try {
    // 获取所有有 Tuya 账户的用户
    const users = await prisma.user.findMany({
      where: {
        tuyaAccount: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        tuyaAccount: true,
        tuyaCountryCode: true,
      },
    })

    console.log(`📊 找到 ${users.length} 个有 Tuya 账户的用户\n`)

    if (users.length === 0) {
      console.log('⚠️  没有找到有 Tuya 账户的用户')
      return
    }

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const user of users) {
      try {
        // 如果已经是目标国家代码，跳过
        if (user.tuyaCountryCode === countryCode) {
          console.log(`⏭️  跳过 ${user.email} (已经是 ${countryCode})`)
          skippedCount++
          continue
        }

        // 更新国家代码
        await prisma.user.update({
          where: { id: user.id },
          data: {
            tuyaCountryCode: countryCode,
          },
        })

        console.log(`✅ 已更新 ${user.email}: ${user.tuyaCountryCode || 'null'} → ${countryCode}`)
        updatedCount++
      } catch (error: any) {
        console.error(`❌ 更新 ${user.email} 失败:`, error.message)
        errorCount++
      }
    }

    console.log('\n📊 更新结果:')
    console.log('====================')
    console.log(`成功: ${updatedCount}`)
    console.log(`跳过: ${skippedCount}`)
    console.log(`失败: ${errorCount}`)
    console.log(`总计: ${users.length}`)
    console.log('')

  } catch (error: any) {
    console.error('❌ 更新失败:', error.message)
    if (error.message.includes('DATABASE_URL')) {
      console.log('   💡 提示: 需要设置 DATABASE_URL 环境变量')
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const countryCode = process.argv[2] || '887'

  if (!countryCode || countryCode.length === 0) {
    console.log('❌ 使用方法错误')
    console.log('')
    console.log('使用方法:')
    console.log('  npx tsx scripts/update-tuya-country-code.ts <country-code>')
    console.log('')
    console.log('示例:')
    console.log('  npx tsx scripts/update-tuya-country-code.ts 887')
    console.log('')
    process.exit(1)
  }

  await updateTuyaCountryCode(countryCode)
  console.log('✅ 更新完成')
  console.log('====================\n')
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})

