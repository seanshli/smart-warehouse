/**
 * 诊断数据库崩溃问题
 * 检查 Prisma schema 与数据库 schema 是否匹配
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function diagnose() {
  console.log('🔍 数据库崩溃诊断')
  console.log('======================================\n')

  try {
    // 1. 测试基本连接
    console.log('1. 测试数据库连接...')
    await prisma.$connect()
    console.log('   ✅ 数据库连接成功\n')

    // 2. 检查 User 表结构
    console.log('2. 检查 User 表...')
    const userCount = await prisma.user.count()
    console.log(`   ✅ User 表存在，有 ${userCount} 个用户\n`)

    // 3. 检查 HouseholdMember 表结构
    console.log('3. 检查 HouseholdMember 表...')
    const membershipCount = await prisma.householdMember.count()
    console.log(`   ✅ HouseholdMember 表存在，有 ${membershipCount} 个成员关系\n`)

    // 4. 测试 householdMemberships 关系
    console.log('4. 测试 householdMemberships 关系...')
    const testUser = await prisma.user.findFirst({
      include: {
        householdMemberships: {
          include: {
            household: true
          }
        }
      }
    })

    if (testUser) {
      console.log(`   ✅ householdMemberships 关系正常`)
      console.log(`   ✅ 用户 "${testUser.email}" 有 ${testUser.householdMemberships.length} 个家庭成员关系\n`)
    } else {
      console.log('   ⚠️  没有找到测试用户\n')
    }

    // 5. 测试 householdMember.findMany 查询
    console.log('5. 测试 householdMember.findMany 查询...')
    if (testUser) {
      const memberships = await prisma.householdMember.findMany({
        where: {
          userId: testUser.id
        },
        include: {
          household: true
        },
        orderBy: {
          joinedAt: 'asc'
        }
      })
      console.log(`   ✅ householdMember.findMany 查询成功，找到 ${memberships.length} 个成员关系\n`)
    } else {
      console.log('   ⚠️  跳过测试（没有测试用户）\n')
    }

    // 6. 测试 itemHistory 嵌套查询
    console.log('6. 测试 itemHistory 嵌套查询...')
    if (testUser && testUser.householdMemberships.length > 0) {
      const householdId = testUser.householdMemberships[0].household.id
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      
      const recentChanges = await prisma.itemHistory.count({
        where: {
          item: {
            householdId: householdId
          },
          createdAt: {
            gte: fiveMinutesAgo
          }
        }
      })
      console.log(`   ✅ itemHistory 嵌套查询成功，找到 ${recentChanges} 个最近更改\n`)
    } else {
      console.log('   ⚠️  跳过测试（没有测试用户或家庭）\n')
    }

    console.log('✅ 所有诊断测试通过！')
    console.log('   如果应用仍然崩溃，请检查：')
    console.log('   1. Vercel 环境变量 DATABASE_URL 是否正确')
    console.log('   2. 数据库 schema 是否与 Prisma schema 匹配')
    console.log('   3. Prisma Client 是否在 Vercel 上正确生成')

  } catch (error: any) {
    console.error('\n❌ 诊断失败！')
    console.error('错误详情:')
    console.error('  消息:', error?.message)
    console.error('  代码:', error?.code)
    console.error('  元数据:', error?.meta)
    console.error('\n可能的原因:')
    
    if (error?.code === 'P2021') {
      console.error('   - 数据库表不存在')
      console.error('   - 需要运行数据库迁移')
    } else if (error?.code === 'P2025') {
      console.error('   - 记录不存在')
    } else if (error?.code?.startsWith('P1')) {
      console.error('   - 数据库连接问题')
      console.error('   - 检查 DATABASE_URL 环境变量')
    } else if (error?.message?.includes('Unknown argument')) {
      console.error('   - Prisma schema 与数据库 schema 不匹配')
      console.error('   - 需要运行: npx prisma db push 或 npx prisma migrate dev')
    } else {
      console.error('   - 未知错误，请查看上面的错误详情')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

diagnose()

