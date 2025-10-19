#!/usr/bin/env node

/**
 * Script to update existing users to admin or create new admin user
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateAdminUsers() {
  try {
    console.log('Updating admin users...')
    
    // Update existing user to admin
    const existingUser = await prisma.user.findUnique({
      where: { email: 'seanshlitw@gmail.com' }
    })

    if (existingUser) {
      const updatedUser = await prisma.user.update({
        where: { email: 'seanshlitw@gmail.com' },
        data: { isAdmin: true }
      })

      console.log('✅ Updated existing user to admin:')
      console.log(`   Email: ${updatedUser.email}`)
      console.log(`   Name: ${updatedUser.name || 'Not set'}`)
      console.log(`   Admin: ${updatedUser.isAdmin}`)
    }

    // Create or update admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@smartwarehouse.com' }
    })

    if (adminUser) {
      const updatedAdmin = await prisma.user.update({
        where: { email: 'admin@smartwarehouse.com' },
        data: { isAdmin: true }
      })

      console.log('✅ Updated admin user:')
      console.log(`   Email: ${updatedAdmin.email}`)
      console.log(`   Name: ${updatedAdmin.name || 'Not set'}`)
      console.log(`   Admin: ${updatedAdmin.isAdmin}`)
    } else {
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@smartwarehouse.com',
          name: 'System Administrator',
          isAdmin: true,
        }
      })

      console.log('✅ Created new admin user:')
      console.log(`   Email: ${newAdmin.email}`)
      console.log(`   Name: ${newAdmin.name}`)
      console.log(`   Admin: ${newAdmin.isAdmin}`)
    }

    console.log('\n🔐 Admin credentials:')
    console.log('   Email: admin@smartwarehouse.com')
    console.log('   Password: admin123')
    console.log('\n   OR')
    console.log('   Email: seanshlitw@gmail.com')
    console.log('   Password: smtengo888')

  } catch (error) {
    console.error('❌ Error updating admin users:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateAdminUsers()
