#!/usr/bin/env ts-node

/**
 * Verify Admin Setup Script
 * Checks if a user has proper credentials and admin roles set up
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyAdminSetup(email: string) {
  console.log(`\n🔍 Verifying admin setup for: ${email}\n`)
  console.log('=' .repeat(60))

  try {
    // 1. Check if user exists
    console.log('\n1️⃣ Checking if user exists...')
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true
      }
    })

    if (!user) {
      console.log('❌ User not found!')
      return false
    }

    console.log('✅ User found:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Super Admin: ${user.isAdmin ? 'Yes' : 'No'}`)
    console.log(`   Created: ${user.createdAt}`)

    // 2. Check credentials
    console.log('\n2️⃣ Checking credentials...')
    const credentials = await prisma.userCredentials.findUnique({
      where: { userId: user.id },
      select: {
        password: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!credentials) {
      console.log('❌ No credentials found! User cannot log in.')
      console.log('   Run the SQL script to set up credentials.')
      return false
    }

    console.log('✅ Credentials found:')
    console.log(`   Password hash: ${credentials.password.substring(0, 20)}...`)
    console.log(`   Created: ${credentials.createdAt}`)
    console.log(`   Updated: ${credentials.updatedAt}`)

    // 3. Check community admin roles
    console.log('\n3️⃣ Checking community admin roles...')
    const communityMemberships = await prisma.communityMember.findMany({
      where: {
        userId: user.id,
        role: 'ADMIN'
      },
      include: {
        community: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (communityMemberships.length === 0) {
      console.log('⚠️  No community admin roles found')
    } else {
      console.log(`✅ Found ${communityMemberships.length} community admin role(s):`)
      communityMemberships.forEach((cm, index) => {
        console.log(`   ${index + 1}. ${cm.community.name} (ID: ${cm.community.id})`)
      })
    }

    // 4. Check building admin roles
    console.log('\n4️⃣ Checking building admin roles...')
    const buildingMemberships = await prisma.buildingMember.findMany({
      where: {
        userId: user.id,
        role: 'ADMIN'
      },
      include: {
        building: {
          select: {
            id: true,
            name: true,
            community: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (buildingMemberships.length === 0) {
      console.log('⚠️  No building admin roles found')
    } else {
      console.log(`✅ Found ${buildingMemberships.length} building admin role(s):`)
      buildingMemberships.forEach((bm, index) => {
        console.log(`   ${index + 1}. ${bm.building.name} (ID: ${bm.building.id})`)
        console.log(`      Community: ${bm.building.community.name} (ID: ${bm.building.community.id})`)
      })
    }

    // 5. Check supplier admin roles
    console.log('\n5️⃣ Checking supplier admin roles...')
    const supplierMemberships = await prisma.supplierMember.findMany({
      where: {
        userId: user.id,
        role: { in: ['ADMIN', 'MANAGER'] }
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    })

    if (supplierMemberships.length === 0) {
      console.log('⚠️  No supplier admin roles found')
    } else {
      const activeSuppliers = supplierMemberships.filter(m => m.supplier.isActive)
      console.log(`✅ Found ${activeSuppliers.length} active supplier admin role(s):`)
      activeSuppliers.forEach((sm, index) => {
        console.log(`   ${index + 1}. ${sm.supplier.name} (ID: ${sm.supplier.id}) - Role: ${sm.role}`)
      })
    }

    // 6. Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n📊 SUMMARY\n')

    const hasCredentials = !!credentials
    const hasCommunityAdmin = communityMemberships.length > 0
    const hasBuildingAdmin = buildingMemberships.length > 0
    const hasSupplierAdmin = supplierMemberships.filter(m => m.supplier.isActive).length > 0
    const hasAnyAdminRole = user.isAdmin || hasCommunityAdmin || hasBuildingAdmin || hasSupplierAdmin

    console.log(`Credentials: ${hasCredentials ? '✅ Set up' : '❌ Missing'}`)
    console.log(`Super Admin: ${user.isAdmin ? '✅ Yes' : '❌ No'}`)
    console.log(`Community Admin: ${hasCommunityAdmin ? `✅ Yes (${communityMemberships.length})` : '❌ No'}`)
    console.log(`Building Admin: ${hasBuildingAdmin ? `✅ Yes (${buildingMemberships.length})` : '❌ No'}`)
    console.log(`Supplier Admin: ${hasSupplierAdmin ? '✅ Yes' : '❌ No'}`)

    if (!hasCredentials) {
      console.log('\n❌ SETUP INCOMPLETE: User cannot log in without credentials.')
      return false
    }

    if (!hasAnyAdminRole) {
      console.log('\n⚠️  WARNING: User has credentials but no admin roles.')
      console.log('   User can log in but may not have admin access.')
      return false
    }

    console.log('\n✅ SETUP COMPLETE: User is ready to log in with admin access!')
    console.log('\n📝 Next steps:')
    console.log('   1. User can log in at /admin-auth/signin')
    console.log('   2. JWT token will include admin flags')
    console.log('   3. Middleware will enforce access control')
    console.log('   4. API endpoints will filter data appropriately')

    return true

  } catch (error) {
    console.error('\n❌ Error verifying admin setup:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('Usage: ts-node verify-admin-setup.ts <email>')
  console.error('Example: ts-node verify-admin-setup.ts ad.twinoak@twinoak.com')
  process.exit(1)
}

verifyAdminSetup(email)
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
