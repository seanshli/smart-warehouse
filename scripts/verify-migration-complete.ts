#!/usr/bin/env ts-node
/**
 * Verify that the Community and Building migration was completed successfully
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface VerificationResult {
  check: string
  status: '✅ PASS' | '❌ FAIL'
  message: string
}

async function verifyMigration() {
  console.log('🔍 验证数据库迁移...\n')
  
  const results: VerificationResult[] = []

  try {
    // 1. Test Community model
    try {
      const communities = await prisma.community.findMany({ take: 1 })
      results.push({
        check: 'Community 模型',
        status: '✅ PASS',
        message: `模型可访问，当前有 ${await prisma.community.count()} 个社区`
      })
    } catch (error: any) {
      results.push({
        check: 'Community 模型',
        status: '❌ FAIL',
        message: error.message || '模型不可访问'
      })
    }

    // 2. Test Building model
    try {
      const buildings = await prisma.building.findMany({ take: 1 })
      results.push({
        check: 'Building 模型',
        status: '✅ PASS',
        message: `模型可访问，当前有 ${await prisma.building.count()} 个建筑`
      })
    } catch (error: any) {
      results.push({
        check: 'Building 模型',
        status: '❌ FAIL',
        message: error.message || '模型不可访问'
      })
    }

    // 3. Test CommunityMember model
    try {
      const members = await prisma.communityMember.findMany({ take: 1 })
      results.push({
        check: 'CommunityMember 模型',
        status: '✅ PASS',
        message: `模型可访问，当前有 ${await prisma.communityMember.count()} 个成员`
      })
    } catch (error: any) {
      results.push({
        check: 'CommunityMember 模型',
        status: '❌ FAIL',
        message: error.message || '模型不可访问'
      })
    }

    // 4. Test WorkingGroup model
    try {
      const groups = await prisma.workingGroup.findMany({ take: 1 })
      results.push({
        check: 'WorkingGroup 模型',
        status: '✅ PASS',
        message: `模型可访问，当前有 ${await prisma.workingGroup.count()} 个工作组`
      })
    } catch (error: any) {
      results.push({
        check: 'WorkingGroup 模型',
        status: '❌ FAIL',
        message: error.message || '模型不可访问'
      })
    }

    // 5. Test WorkingGroupMember model
    try {
      const groupMembers = await prisma.workingGroupMember.findMany({ take: 1 })
      results.push({
        check: 'WorkingGroupMember 模型',
        status: '✅ PASS',
        message: `模型可访问，当前有 ${await prisma.workingGroupMember.count()} 个工作组成员`
      })
    } catch (error: any) {
      results.push({
        check: 'WorkingGroupMember 模型',
        status: '❌ FAIL',
        message: error.message || '模型不可访问'
      })
    }

    // 6. Test WorkingGroupPermission model
    try {
      const permissions = await prisma.workingGroupPermission.findMany({ take: 1 })
      results.push({
        check: 'WorkingGroupPermission 模型',
        status: '✅ PASS',
        message: `模型可访问，当前有 ${await prisma.workingGroupPermission.count()} 个权限`
      })
    } catch (error: any) {
      results.push({
        check: 'WorkingGroupPermission 模型',
        status: '❌ FAIL',
        message: error.message || '模型不可访问'
      })
    }

    // 7. Test Household.buildingId field
    try {
      const households = await prisma.household.findMany({
        take: 1,
        select: { id: true, name: true, buildingId: true }
      })
      results.push({
        check: 'Household.buildingId 字段',
        status: '✅ PASS',
        message: '字段存在且可访问'
      })
    } catch (error: any) {
      results.push({
        check: 'Household.buildingId 字段',
        status: '❌ FAIL',
        message: error.message || '字段不存在或不可访问'
      })
    }

    // 8. Test relationships
    try {
      const communityWithBuildings = await prisma.community.findFirst({
        include: {
          buildings: true,
          members: true,
          workingGroups: true
        }
      })
      results.push({
        check: 'Community 关系',
        status: '✅ PASS',
        message: '关系（buildings, members, workingGroups）可访问'
      })
    } catch (error: any) {
      results.push({
        check: 'Community 关系',
        status: '❌ FAIL',
        message: error.message || '关系不可访问'
      })
    }

    // 9. Test Building relationships
    try {
      const buildingWithRelations = await prisma.building.findFirst({
        include: {
          community: true,
          households: true
        }
      })
      results.push({
        check: 'Building 关系',
        status: '✅ PASS',
        message: '关系（community, households）可访问'
      })
    } catch (error: any) {
      results.push({
        check: 'Building 关系',
        status: '❌ FAIL',
        message: error.message || '关系不可访问'
      })
    }

    // 10. Test foreign key constraints (by trying to create invalid data)
    try {
      // This should fail if foreign key constraints are working
      await prisma.building.create({
        data: {
          name: 'Test Building',
          communityId: 'invalid-community-id-that-does-not-exist',
        }
      })
      results.push({
        check: '外键约束',
        status: '❌ FAIL',
        message: '外键约束未生效（允许无效的 communityId）'
      })
    } catch (error: any) {
      if (error.code === 'P2003' || error.message.includes('foreign key') || error.message.includes('constraint')) {
        results.push({
          check: '外键约束',
          status: '✅ PASS',
          message: '外键约束正常工作'
        })
      } else {
        results.push({
          check: '外键约束',
          status: '❌ FAIL',
          message: `意外错误: ${error.message}`
        })
      }
    }

  } catch (error: any) {
    console.error('验证过程出错:', error)
    results.push({
      check: '验证过程',
      status: '❌ FAIL',
      message: error.message || '未知错误'
    })
  } finally {
    await prisma.$disconnect()
  }

  // Print results
  console.log('📊 验证结果:')
  console.log('====================\n')
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.check}`)
    console.log(`   ${result.status}`)
    console.log(`   ${result.message}\n`)
  })

  const passed = results.filter(r => r.status === '✅ PASS').length
  const failed = results.filter(r => r.status === '❌ FAIL').length
  const total = results.length

  console.log('====================')
  console.log(`总计: ${total} 项检查`)
  console.log(`✅ 通过: ${passed}`)
  console.log(`❌ 失败: ${failed}`)
  console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%\n`)

  if (failed === 0) {
    console.log('🎉 所有验证通过！迁移成功完成！')
    process.exit(0)
  } else {
    console.log('⚠️  部分验证失败，请检查错误信息')
    process.exit(1)
  }
}

verifyMigration().catch(error => {
  console.error('验证脚本执行失败:', error)
  process.exit(1)
})

