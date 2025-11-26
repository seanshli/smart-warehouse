/**
 * Setup enGo Smart Home Community
 * 设置智管家社区
 * 
 * Creates:
 * - Community: enGo Smart Home / 智管家
 * - Building 1: 台北八德路
 * - Building 2: 三重合野
 * - Building 3: 台中大雅
 * 
 * Each building gets its own admin user
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function generateInvitationCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding confusing characters
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function main() {
  try {
    console.log('🚀 Starting enGo Smart Home community setup...\n')

    // 1. Create Community Admin User
    const communityAdminEmail = 'engo-admin@smartwarehouse.com'
    const communityAdminPassword = 'EnGo@2024!Admin'
    
    console.log('📧 Creating community admin user...')
    let communityAdmin = await prisma.user.findUnique({
      where: { email: communityAdminEmail },
    })

    if (!communityAdmin) {
      communityAdmin = await prisma.user.create({
        data: {
          email: communityAdminEmail,
          name: 'enGo Smart Home Admin',
          isAdmin: false, // Community admin, not super admin
        },
      })
      
      // Create user credentials
      const hashedPassword = await bcrypt.hash(communityAdminPassword, 12)
      await prisma.userCredentials.create({
        data: {
          userId: communityAdmin.id,
          password: hashedPassword,
        },
      })
      console.log(`✅ Created community admin: ${communityAdminEmail}`)
    } else {
      console.log(`ℹ️  Community admin already exists: ${communityAdminEmail}`)
      
      // Ensure credentials exist
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
        console.log(`✅ Created community admin credentials`)
      }
    }

    // 2. Create Community
    const communityInvitationCode = await generateInvitationCode()
    console.log('\n🏘️  Creating enGo Smart Home community...')
    
    let community = await prisma.community.findFirst({
      where: {
        OR: [
          { name: 'enGo Smart Home' },
          { name: '智管家' },
        ],
      },
    })

    if (!community) {
      community = await prisma.community.create({
        data: {
          name: 'enGo Smart Home / 智管家',
          description: 'enGo Smart Home Community - Intelligent Home Management System / 智管家社区 - 智能家居管理系统',
          invitationCode: communityInvitationCode,
          address: 'Taiwan / 台灣',
          country: 'Taiwan',
        },
      })
      console.log(`✅ Created community: ${community.name}`)
      console.log(`   Invitation Code: ${communityInvitationCode}`)
    } else {
      console.log(`ℹ️  Community already exists: ${community.name}`)
      if (!community.invitationCode) {
        const newInvitationCode = await generateInvitationCode()
        await prisma.community.update({
          where: { id: community.id },
          data: { invitationCode: newInvitationCode },
        })
        console.log(`   Updated Invitation Code: ${newInvitationCode}`)
      }
    }

    // 3. Add Community Admin as Community Member
    console.log('\n👤 Adding community admin to community...')
    const existingCommunityMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: communityAdmin.id,
          communityId: community.id,
        },
      },
    })

    if (!existingCommunityMember) {
      await prisma.communityMember.create({
        data: {
          userId: communityAdmin.id,
          communityId: community.id,
          role: 'ADMIN',
        },
      })
      console.log(`✅ Added ${communityAdminEmail} as community ADMIN`)
    } else {
      // Update role to ADMIN if not already
      if (existingCommunityMember.role !== 'ADMIN') {
        await prisma.communityMember.update({
          where: {
            userId_communityId: {
              userId: communityAdmin.id,
              communityId: community.id,
            },
          },
          data: { role: 'ADMIN' },
        })
        console.log(`✅ Updated ${communityAdminEmail} role to ADMIN`)
      } else {
        console.log(`ℹ️  ${communityAdminEmail} is already community ADMIN`)
      }
    }

    // 4. Create Buildings
    const buildings = [
      {
        name: '台北八德路',
        nameZh: '台北八德路',
        address: '八德路, 台北市, 台灣',
        addressZh: '八德路, 台北市, 台灣',
        adminEmail: 'taipei-bade-admin@smartwarehouse.com',
        adminPassword: 'Taipei@2024!Bade',
        adminName: '台北八德路管理員',
      },
      {
        name: '三重合野',
        nameZh: '三重合野',
        address: '三重區, 新北市, 台灣',
        addressZh: '三重區, 新北市, 台灣',
        adminEmail: 'sanchong-heye-admin@smartwarehouse.com',
        adminPassword: 'Sanchong@2024!Heye',
        adminName: '三重合野管理員',
      },
      {
        name: '台中大雅',
        nameZh: '台中大雅',
        address: '大雅區, 台中市, 台灣',
        addressZh: '大雅區, 台中市, 台灣',
        adminEmail: 'taichung-daya-admin@smartwarehouse.com',
        adminPassword: 'Taichung@2024!Daya',
        adminName: '台中大雅管理員',
      },
    ]

    console.log('\n🏢 Creating buildings...\n')

    for (const buildingData of buildings) {
      // Create building admin user
      console.log(`📧 Creating admin for ${buildingData.name}...`)
      let buildingAdmin = await prisma.user.findUnique({
        where: { email: buildingData.adminEmail },
      })

      if (!buildingAdmin) {
        buildingAdmin = await prisma.user.create({
          data: {
            email: buildingData.adminEmail,
            name: buildingData.adminName,
            isAdmin: false,
          },
        })
        
        // Create user credentials
        const hashedPassword = await bcrypt.hash(buildingData.adminPassword, 12)
        await prisma.userCredentials.create({
          data: {
            userId: buildingAdmin.id,
            password: hashedPassword,
          },
        })
        console.log(`   ✅ Created building admin: ${buildingData.adminEmail}`)
      } else {
        console.log(`   ℹ️  Building admin already exists: ${buildingData.adminEmail}`)
        
        // Ensure credentials exist
        const existingCreds = await prisma.userCredentials.findUnique({
          where: { userId: buildingAdmin.id },
        })
        
        if (!existingCreds) {
          const hashedPassword = await bcrypt.hash(buildingData.adminPassword, 12)
          await prisma.userCredentials.create({
            data: {
              userId: buildingAdmin.id,
              password: hashedPassword,
            },
          })
          console.log(`   ✅ Created building admin credentials`)
        }
      }

      // Create building
      const buildingInvitationCode = await generateInvitationCode()
      console.log(`\n🏢 Creating building: ${buildingData.name}...`)
      
      let building = await prisma.building.findFirst({
        where: {
          name: buildingData.name,
          communityId: community.id,
        },
      })

      if (!building) {
        building = await prisma.building.create({
          data: {
            name: buildingData.name,
            description: `Building in ${buildingData.address} / 位於${buildingData.addressZh}的建築`,
            address: buildingData.address,
            communityId: community.id,
            invitationCode: buildingInvitationCode,
          },
        })
        console.log(`   ✅ Created building: ${building.name}`)
        console.log(`   📋 Invitation Code: ${buildingInvitationCode}`)
      } else {
        console.log(`   ℹ️  Building already exists: ${building.name}`)
        if (!building.invitationCode) {
          await prisma.building.update({
            where: { id: building.id },
            data: { invitationCode: buildingInvitationCode },
          })
          console.log(`   📋 Updated Invitation Code: ${buildingInvitationCode}`)
        }
      }

      // Add building admin to community as MANAGER
      console.log(`\n👤 Adding ${buildingData.adminEmail} to community as MANAGER...`)
      const existingCommunityMemberForBuilding = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: buildingAdmin.id,
            communityId: community.id,
          },
        },
      })

      if (!existingCommunityMemberForBuilding) {
        await prisma.communityMember.create({
          data: {
            userId: buildingAdmin.id,
            communityId: community.id,
            role: 'MANAGER',
          },
        })
        console.log(`   ✅ Added ${buildingData.adminEmail} as community MANAGER`)
      } else {
        if (existingCommunityMemberForBuilding.role !== 'MANAGER' && existingCommunityMemberForBuilding.role !== 'ADMIN') {
          await prisma.communityMember.update({
            where: {
              userId_communityId: {
                userId: buildingAdmin.id,
                communityId: community.id,
              },
            },
            data: { role: 'MANAGER' },
          })
          console.log(`   ✅ Updated ${buildingData.adminEmail} role to MANAGER`)
        } else {
          console.log(`   ℹ️  ${buildingData.adminEmail} already has appropriate role`)
        }
      }

      // Add building admin as building member
      console.log(`\n👤 Adding ${buildingData.adminEmail} as building member...`)
      const existingBuildingMember = await prisma.buildingMember.findUnique({
        where: {
          userId_buildingId: {
            userId: buildingAdmin.id,
            buildingId: building.id,
          },
        },
      })

      if (!existingBuildingMember) {
        await prisma.buildingMember.create({
          data: {
            userId: buildingAdmin.id,
            buildingId: building.id,
            role: 'ADMIN',
          },
        })
        console.log(`   ✅ Added ${buildingData.adminEmail} as building ADMIN`)
      } else {
        if (existingBuildingMember.role !== 'ADMIN') {
          await prisma.buildingMember.update({
            where: {
              userId_buildingId: {
                userId: buildingAdmin.id,
                buildingId: building.id,
              },
            },
            data: { role: 'ADMIN' },
          })
          console.log(`   ✅ Updated ${buildingData.adminEmail} role to building ADMIN`)
        } else {
          console.log(`   ℹ️  ${buildingData.adminEmail} is already building ADMIN`)
        }
      }

      console.log(`\n✅ Completed setup for ${buildingData.name}\n`)
      console.log('─'.repeat(60))
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SETUP SUMMARY')
    console.log('='.repeat(60))
    console.log(`\n🏘️  Community: ${community.name}`)
    console.log(`   ID: ${community.id}`)
    console.log(`   Invitation Code: ${community.invitationCode}`)
    console.log(`\n👤 Community Admin:`)
    console.log(`   Email: ${communityAdminEmail}`)
    console.log(`   Password: ${communityAdminPassword}`)
    
    console.log(`\n🏢 Buildings:`)
    for (const buildingData of buildings) {
      const building = await prisma.building.findFirst({
        where: {
          name: buildingData.name,
          communityId: community.id,
        },
      })
      if (building) {
        console.log(`\n   ${building.name}:`)
        console.log(`      ID: ${building.id}`)
        console.log(`      Invitation Code: ${building.invitationCode}`)
        console.log(`      Admin: ${buildingData.adminEmail}`)
        console.log(`      Password: ${buildingData.adminPassword}`)
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ enGo Smart Home community setup completed!')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('❌ Error setting up enGo Smart Home community:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

