#!/usr/bin/env tsx
/**
 * 腳本：將 Home Assistant 服務器鏈接到 Unit 3A household
 * 
 * 使用方法：
 *   tsx scripts/link-ha-to-unit3a.ts <baseUrl> <accessToken>
 * 
 * 例如：
 *   tsx scripts/link-ha-to-unit3a.ts https://homeassistant.local:8123 eyJ0eXAiOiJKV1QiLCJhbGc...
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function linkHAToUnit3A(baseUrl: string, accessToken: string) {
  try {
    console.log('🔍 查找 Unit 3A household...')

    // 查找名為 "Unit 3A" 或 apartmentNo 為 "3A" 的 household
    const household = await prisma.household.findFirst({
      where: {
        OR: [
          { name: { contains: '3A', mode: 'insensitive' } },
          { apartmentNo: { contains: '3A', mode: 'insensitive' } },
        ],
      },
    })

    if (!household) {
      console.error('❌ 未找到 Unit 3A household')
      console.log('\n可用的 households:')
      const allHouseholds = await prisma.household.findMany({
        select: {
          id: true,
          name: true,
          apartmentNo: true,
        },
        take: 20,
      })
      allHouseholds.forEach(h => {
        console.log(`  - ${h.name} (${h.apartmentNo || 'N/A'})`)
      })
      return
    }

    console.log(`✅ 找到 household: ${household.name} (${household.apartmentNo || 'N/A'})`)
    console.log(`   ID: ${household.id}`)

    // 驗證 HA 連接
    console.log('\n🔗 驗證 Home Assistant 連接...')
    try {
      const testResponse = await fetch(`${baseUrl}/api/config`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!testResponse.ok) {
        throw new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}`)
      }

      const config = await testResponse.json()
      console.log(`✅ Home Assistant 連接成功`)
      console.log(`   Location: ${config.location_name || 'Unknown'}`)
      console.log(`   Version: ${config.version || 'Unknown'}`)
    } catch (error) {
      console.error('❌ Home Assistant 連接失敗:', error)
      throw error
    }

    // 創建或更新 HA 配置
    console.log('\n💾 保存配置...')
    const haConfig = await prisma.homeAssistantConfig.upsert({
      where: { householdId: household.id },
      update: {
        baseUrl: baseUrl.trim(),
        accessToken: accessToken.trim(),
        updatedAt: new Date(),
      },
      create: {
        householdId: household.id,
        baseUrl: baseUrl.trim(),
        accessToken: accessToken.trim(),
      },
    })

    console.log('✅ Home Assistant 已成功鏈接到 Unit 3A')
    console.log(`\n配置詳情:`)
    console.log(`  Household: ${household.name}`)
    console.log(`  HA URL: ${haConfig.baseUrl}`)
    console.log(`  配置 ID: ${haConfig.id}`)

  } catch (error) {
    console.error('❌ 錯誤:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 主函數
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log('使用方法: tsx scripts/link-ha-to-unit3a.ts <baseUrl> <accessToken>')
    console.log('\n例如:')
    console.log('  tsx scripts/link-ha-to-unit3a.ts https://homeassistant.local:8123 eyJ0eXAiOiJKV1QiLCJhbGc...')
    process.exit(1)
  }

  const [baseUrl, accessToken] = args
  await linkHAToUnit3A(baseUrl, accessToken)
}

main()

