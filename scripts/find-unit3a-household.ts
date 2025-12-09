#!/usr/bin/env tsx
/**
 * 腳本：查找 Unit 3A household
 * 
 * 使用方法：
 *   tsx scripts/find-unit3a-household.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findUnit3A() {
  try {
    console.log('🔍 查找 Unit 3A household...\n')

    // 查找名為 "Unit 3A" 或 apartmentNo 為 "3A" 的 household
    const households = await prisma.household.findMany({
      where: {
        OR: [
          { name: { contains: '3A', mode: 'insensitive' } },
          { apartmentNo: { contains: '3A', mode: 'insensitive' } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        building: {
          select: {
            id: true,
            name: true,
          },
        },
        homeAssistantConfig: {
          select: {
            id: true,
            baseUrl: true,
            createdAt: true,
          },
        },
      },
    })

    if (households.length === 0) {
      console.log('❌ 未找到 Unit 3A household\n')
      console.log('可用的 households (前 20 個):')
      const allHouseholds = await prisma.household.findMany({
        select: {
          id: true,
          name: true,
          apartmentNo: true,
        },
        take: 20,
      })
      allHouseholds.forEach(h => {
        console.log(`  - ${h.name} (${h.apartmentNo || 'N/A'}) [ID: ${h.id}]`)
      })
      return
    }

    console.log(`✅ 找到 ${households.length} 個匹配的 household:\n`)

    households.forEach((household, index) => {
      console.log(`${index + 1}. ${household.name}`)
      console.log(`   ID: ${household.id}`)
      console.log(`   Apartment No: ${household.apartmentNo || 'N/A'}`)
      console.log(`   Building: ${household.building?.name || 'N/A'}`)
      console.log(`   Members: ${household.members.length}`)
      household.members.forEach(m => {
        console.log(`     - ${m.user.name || m.user.email} (${m.role})`)
      })
      
      if (household.homeAssistantConfig) {
        console.log(`   ✅ Home Assistant 已配置`)
        console.log(`      URL: ${household.homeAssistantConfig.baseUrl}`)
        console.log(`      配置時間: ${household.homeAssistantConfig.createdAt}`)
      } else {
        console.log(`   ⚠️  Home Assistant 未配置`)
      }
      console.log('')
    })

    // 如果找到多個，提示用戶選擇
    if (households.length > 1) {
      console.log('💡 找到多個匹配的 household，請確認哪個是正確的 Unit 3A')
    } else {
      const household = households[0]
      console.log('💡 要鏈接 Home Assistant，運行:')
      console.log(`   tsx scripts/link-ha-to-unit3a.ts <baseUrl> <accessToken>`)
      console.log(`   或使用 API:`)
      console.log(`   POST /api/household/${household.id}/homeassistant`)
      console.log(`   Body: { "baseUrl": "...", "accessToken": "..." }`)
    }

  } catch (error) {
    console.error('❌ 錯誤:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

async function main() {
  await findUnit3A()
}

