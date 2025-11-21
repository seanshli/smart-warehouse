// 验证 tuya_home_id 字段是否已添加到数据库
// Verify that tuya_home_id column has been added to the database

import { prisma } from '../lib/prisma'

async function verifyTuyaHomeId() {
  try {
    console.log('🔍 验证 tuya_home_id 字段...')
    
    // 尝试查询一个 household，检查是否有 tuyaHomeId 字段
    const households = await prisma.household.findMany({
      take: 1,
      select: {
        id: true,
        name: true,
        tuyaHomeId: true,
      },
    })

    if (households.length > 0) {
      const household = households[0]
      console.log('✅ 字段验证成功！')
      console.log(`   Household ID: ${household.id}`)
      console.log(`   Household Name: ${household.name}`)
      console.log(`   Tuya Home ID: ${household.tuyaHomeId || '(null - 正常，尚未配网)'}`)
      console.log('')
      console.log('✅ Prisma Client 可以正常访问 tuyaHomeId 字段')
      return true
    } else {
      console.log('⚠️  没有找到任何 Household，但字段应该已添加')
      return true
    }
  } catch (error: any) {
    if (error.message?.includes('tuya_home_id') || error.message?.includes('tuyaHomeId')) {
      console.error('❌ 错误：字段可能尚未添加到数据库')
      console.error('   请确保已在 Supabase Dashboard 运行 SQL 脚本')
      return false
    } else {
      console.error('❌ 验证时出错:', error.message)
      return false
    }
  } finally {
    await prisma.$disconnect()
  }
}

verifyTuyaHomeId()
  .then((success) => {
    if (success) {
      console.log('')
      console.log('🎉 验证完成！')
      process.exit(0)
    } else {
      console.log('')
      console.log('❌ 验证失败，请检查数据库迁移')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ 验证过程出错:', error)
    process.exit(1)
  })

