import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

interface BuildingConfig {
  name: string
  adminEmail: string
  adminPassword: string
  adminName: string
}

async function setupTwinOakCommunity() {
  try {
    console.log('🏘️  开始设置 Twin-Oak / 雙橡園 社区...\n')

    // 1. 创建社区管理员账户
    const communityAdminEmail = 'twin-oak-admin@smartwarehouse.com'
    const communityAdminPassword = 'TwinOak2024!@#'
    const communityAdminName = 'Twin-Oak Community Admin'

    console.log('📝 创建社区管理员账户...')
    let communityAdmin = await prisma.user.findUnique({
      where: { email: communityAdminEmail },
    })

    if (!communityAdmin) {
      communityAdmin = await prisma.user.create({
        data: {
          email: communityAdminEmail,
          name: communityAdminName,
        },
      })
      
      // 创建用户凭证
      const hashedPassword = await bcrypt.hash(communityAdminPassword, 12)
      await prisma.userCredentials.create({
        data: {
          userId: communityAdmin.id,
          password: hashedPassword,
        },
      })
      console.log(`✅ 社区管理员账户已创建: ${communityAdminEmail}`)
    } else {
      console.log(`ℹ️  社区管理员账户已存在: ${communityAdminEmail}`)
      
      // 确保有凭证
      const existingCreds = await prisma.userCredentials.findUnique({
        where: { userId: communityAdmin.id },
      })
      
      if (!existingCreds) {
        const hashedPassword = await bcrypt.hash(communityAdminPassword, 12)
        await prisma.userCredentials.create({
          data: {
            userId: communityAdmin.id,
            password: hashedPassword,
          },
        })
        console.log(`✅ 社区管理员凭证已创建`)
      }
    }

    // 2. 创建社区
    console.log('\n🏘️  创建社区...')
    let community = await prisma.community.findFirst({
      where: {
        name: {
          contains: 'Twin-Oak',
        },
      },
    })

    if (!community) {
      community = await prisma.community.create({
        data: {
          name: 'Twin-Oak / 雙橡園',
          description: 'Twin-Oak Community Management',
          address: 'Taiwan',
          country: 'Taiwan',
          members: {
            create: {
              userId: communityAdmin.id,
              role: 'ADMIN',
            },
          },
        },
      })
      console.log(`✅ 社区已创建: ${community.name} (ID: ${community.id})`)
    } else {
      console.log(`ℹ️  社区已存在: ${community.name} (ID: ${community.id})`)
      
      // 确保社区管理员是成员
      const existingMember = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: communityAdmin.id,
            communityId: community.id,
          },
        },
      })

      if (!existingMember) {
        await prisma.communityMember.create({
          data: {
            userId: communityAdmin.id,
            communityId: community.id,
            role: 'ADMIN',
          },
        })
        console.log(`✅ 社区管理员已添加到社区`)
      }
    }

    // 3. 定义建筑配置
    const buildings: BuildingConfig[] = [
      {
        name: 'Twin-Oak S1',
        adminEmail: 'twin-oak-s1-admin@smartwarehouse.com',
        adminPassword: 'TwinOakS1!@#2024',
        adminName: 'Twin-Oak S1 Building Admin',
      },
      {
        name: '雙橡園1812',
        adminEmail: 'twin-oak-1812-admin@smartwarehouse.com',
        adminPassword: 'TwinOak1812!@#2024',
        adminName: '雙橡園1812 Building Admin',
      },
      {
        name: '雙橡園1617',
        adminEmail: 'twin-oak-1617-admin@smartwarehouse.com',
        adminPassword: 'TwinOak1617!@#2024',
        adminName: '雙橡園1617 Building Admin',
      },
      {
        name: 'Twin-Oak V1',
        adminEmail: 'twin-oak-v1-admin@smartwarehouse.com',
        adminPassword: 'TwinOakV1!@#2024',
        adminName: 'Twin-Oak V1 Building Admin',
      },
    ]

    // 4. 创建建筑和管理员
    console.log('\n🏢 创建建筑和管理员...\n')
    const buildingResults: Array<{ building: any; admin: any }> = []

    for (const buildingConfig of buildings) {
      // 创建建筑管理员账户
      console.log(`📝 创建建筑管理员: ${buildingConfig.name}...`)
      let buildingAdmin = await prisma.user.findUnique({
        where: { email: buildingConfig.adminEmail },
      })

      if (!buildingAdmin) {
        buildingAdmin = await prisma.user.create({
          data: {
            email: buildingConfig.adminEmail,
            name: buildingConfig.adminName,
          },
        })
        
        // 创建用户凭证
        const hashedPassword = await bcrypt.hash(buildingConfig.adminPassword, 12)
        await prisma.userCredentials.create({
          data: {
            userId: buildingAdmin.id,
            password: hashedPassword,
          },
        })
        console.log(`   ✅ 管理员账户已创建: ${buildingConfig.adminEmail}`)
      } else {
        console.log(`   ℹ️  管理员账户已存在: ${buildingConfig.adminEmail}`)
        
        // 确保有凭证
        const existingCreds = await prisma.userCredentials.findUnique({
          where: { userId: buildingAdmin.id },
        })
        
        if (!existingCreds) {
          const hashedPassword = await bcrypt.hash(buildingConfig.adminPassword, 12)
          await prisma.userCredentials.create({
            data: {
              userId: buildingAdmin.id,
              password: hashedPassword,
            },
          })
          console.log(`   ✅ 管理员凭证已创建`)
        }
      }

      // 确保建筑管理员是社区成员（作为 MANAGER）
      const existingMember = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: buildingAdmin.id,
            communityId: community.id,
          },
        },
      })

      if (!existingMember) {
        await prisma.communityMember.create({
          data: {
            userId: buildingAdmin.id,
            communityId: community.id,
            role: 'MANAGER', // 建筑管理员作为社区 MANAGER
          },
        })
        console.log(`   ✅ 建筑管理员已添加到社区（角色: MANAGER）`)
      }

      // 创建建筑
      console.log(`🏢 创建建筑: ${buildingConfig.name}...`)
      let building = await prisma.building.findFirst({
        where: {
          name: buildingConfig.name,
          communityId: community.id,
        },
      })

      if (!building) {
        building = await prisma.building.create({
          data: {
            communityId: community.id,
            name: buildingConfig.name,
            description: `${buildingConfig.name} Building`,
          },
        })
        console.log(`   ✅ 建筑已创建: ${building.name} (ID: ${building.id})`)
      } else {
        console.log(`   ℹ️  建筑已存在: ${building.name} (ID: ${building.id})`)
      }

      buildingResults.push({ building, admin: buildingAdmin })
      console.log('')
    }

    // 5. 输出摘要
    console.log('='.repeat(60))
    console.log('📋 设置摘要')
    console.log('='.repeat(60))
    console.log(`\n🏘️  社区:`)
    console.log(`   名称: ${community.name}`)
    console.log(`   ID: ${community.id}`)
    console.log(`   邀请码: ${community.invitationCode || 'N/A'}`)
    console.log(`\n👤 社区管理员:`)
    console.log(`   邮箱: ${communityAdminEmail}`)
    console.log(`   密码: ${communityAdminPassword}`)
    console.log(`   角色: ADMIN`)

    console.log(`\n🏢 建筑列表:`)
    buildingResults.forEach((result, index) => {
      const config = buildings[index]
      console.log(`\n   ${index + 1}. ${result.building.name}`)
      console.log(`      建筑 ID: ${result.building.id}`)
      console.log(`      管理员邮箱: ${config.adminEmail}`)
      console.log(`      管理员密码: ${config.adminPassword}`)
      console.log(`      社区角色: MANAGER`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('✅ 设置完成！')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ 设置失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行设置
setupTwinOakCommunity()
  .then(() => {
    console.log('\n🎉 所有设置已完成！')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 设置过程中出现错误:', error)
    process.exit(1)
  })

