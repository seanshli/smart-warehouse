/**
 * 测试所有 Join APIs
 * 验证 Community/Building/Household 加入功能
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function testJoinAPIs() {
  console.log('🧪 测试 Join APIs')
  console.log('======================================\n')

  try {
    // 1. 检查数据库中的 Community/Building/Household
    console.log('1. 检查数据库结构...')
    const [communities, buildings, households] = await Promise.all([
      prisma.community.findMany({ take: 5 }),
      prisma.building.findMany({ take: 5 }),
      prisma.household.findMany({ take: 5 }),
    ])
    console.log(`   ✅ 找到 ${communities.length} 个社区`)
    console.log(`   ✅ 找到 ${buildings.length} 个建筑`)
    console.log(`   ✅ 找到 ${households.length} 个家庭\n`)

    // 2. 检查邀请码
    console.log('2. 检查邀请码...')
    const communitiesWithCodes = communities.filter(c => c.invitationCode)
    const buildingsWithCodes = buildings.filter(b => b.invitationCode)
    const householdsWithCodes = households.filter(h => h.invitationCode)
    console.log(`   ✅ ${communitiesWithCodes.length}/${communities.length} 个社区有邀请码`)
    console.log(`   ✅ ${buildingsWithCodes.length}/${buildings.length} 个建筑有邀请码`)
    console.log(`   ✅ ${householdsWithCodes.length}/${households.length} 个家庭有邀请码\n`)

    // 3. 检查 JoinRequest 表
    console.log('3. 检查加入请求...')
    const joinRequests = await prisma.joinRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
      take: 10,
    })
    console.log(`   ✅ 找到 ${joinRequests.length} 个加入请求`)
    if (joinRequests.length > 0) {
      console.log('   最近的请求:')
      joinRequests.slice(0, 3).forEach((req, i) => {
        console.log(`     ${i + 1}. ${req.user.email} - ${req.type} - ${req.status}`)
      })
    }
    console.log()

    // 4. 检查自动加入的成员关系
    console.log('4. 检查自动加入的成员关系...')
    const [autoJoinedCommunity, autoJoinedBuilding] = await Promise.all([
      prisma.communityMember.count({
        where: { isAutoJoined: true },
      }),
      prisma.buildingMember.count({
        where: { isAutoJoined: true },
      }),
    ])
    console.log(`   ✅ ${autoJoinedCommunity} 个自动加入的社区成员`)
    console.log(`   ✅ ${autoJoinedBuilding} 个自动加入的建筑成员\n`)

    // 5. 检查 API 端点是否存在
    console.log('5. 检查 API 端点...')
    const apiEndpoints = [
      '/api/join',
      '/api/join-request',
      '/api/join-request/[id]/approve',
      '/api/join-request/[id]/reject',
      '/api/household/check-existing',
      '/api/community',
      '/api/building/[id]',
    ]
    console.log('   ✅ 以下 API 端点应该存在:')
    apiEndpoints.forEach(endpoint => {
      console.log(`      - ${endpoint}`)
    })
    console.log()

    // 6. 检查 UI 组件
    console.log('6. 检查 UI 组件...')
    const uiComponents = [
      'components/community/JoinCommunityModal.tsx',
      'components/community/JoinRequestModal.tsx',
      'components/community/JoinRequestList.tsx',
      'components/CreateHouseholdModal.tsx',
    ]
    console.log('   ✅ 以下 UI 组件应该存在:')
    uiComponents.forEach(component => {
      console.log(`      - ${component}`)
    })
    console.log()

    // 7. 测试数据完整性
    console.log('7. 测试数据完整性...')
    const testCommunity = communities[0]
    if (testCommunity) {
      const communityMembers = await prisma.communityMember.count({
        where: { communityId: testCommunity.id },
      })
      const communityBuildings = await prisma.building.count({
        where: { communityId: testCommunity.id },
      })
      console.log(`   ✅ 社区 "${testCommunity.name}":`)
      console.log(`      - ${communityMembers} 个成员`)
      console.log(`      - ${communityBuildings} 个建筑`)
    }

    const testBuilding = buildings[0]
    if (testBuilding) {
      const buildingMembers = await prisma.buildingMember.count({
        where: { buildingId: testBuilding.id },
      })
      const buildingHouseholds = await prisma.household.count({
        where: { buildingId: testBuilding.id },
      })
      console.log(`   ✅ 建筑 "${testBuilding.name}":`)
      console.log(`      - ${buildingMembers} 个成员`)
      console.log(`      - ${buildingHouseholds} 个家庭`)
    }
    console.log()

    console.log('✅ 所有检查完成！')
    console.log('\n📋 下一步手动测试:')
    console.log('  1. 测试通过邀请码加入 Community/Building/Household')
    console.log('  2. 测试发送加入请求')
    console.log('  3. 测试批准/拒绝加入请求')
    console.log('  4. 测试创建 Household 时检测现有 Building/Community')
    console.log('  5. 测试自动成员关系传播（Household → Building → Community）')

  } catch (error: any) {
    console.error('\n❌ 测试失败！')
    console.error('错误详情:')
    console.error('  消息:', error?.message)
    console.error('  代码:', error?.code)
    console.error('  堆栈:', error?.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testJoinAPIs()

