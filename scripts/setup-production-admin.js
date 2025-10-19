#!/usr/bin/env node

/**
 * Production Admin Setup Script
 * This script properly sets up admin users with database schema updates
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupProductionAdmin() {
  try {
    console.log('🚀 Setting up production admin system...')
    
    // Step 1: Add isAdmin column to users table
    console.log('📊 Updating database schema...')
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false`
      console.log('✅ Added isAdmin column to users table')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ isAdmin column already exists')
      } else {
        throw error
      }
    }

    // Step 2: Create admin users
    console.log('👤 Setting up admin users...')
    
    // Update existing user to admin
    const existingUser = await prisma.user.findUnique({
      where: { email: 'seanshlitw@gmail.com' }
    })

    if (existingUser) {
      const updatedUser = await prisma.user.update({
        where: { email: 'seanshlitw@gmail.com' },
        data: { isAdmin: true }
      })
      console.log(`✅ Updated ${updatedUser.email} to admin`)
    }

    // Create or update dedicated admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@smartwarehouse.com' }
    })

    if (adminUser) {
      const updatedAdmin = await prisma.user.update({
        where: { email: 'admin@smartwarehouse.com' },
        data: { isAdmin: true }
      })
      console.log(`✅ Updated ${updatedAdmin.email} to admin`)
    } else {
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@smartwarehouse.com',
          name: 'System Administrator',
          isAdmin: true,
        }
      })
      console.log(`✅ Created new admin user: ${newAdmin.email}`)
    }

    // Step 3: Verify admin users
    console.log('🔍 Verifying admin users...')
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true
      }
    })

    console.log('\n📋 Admin Users:')
    adminUsers.forEach(user => {
      console.log(`   • ${user.email} (${user.name || 'No name'}) - Created: ${user.createdAt.toLocaleDateString()}`)
    })

    console.log('\n🔐 Admin Credentials:')
    console.log('   Email: admin@smartwarehouse.com')
    console.log('   Password: admin123')
    console.log('\n   OR')
    console.log('   Email: seanshlitw@gmail.com')
    console.log('   Password: smtengo888')

    console.log('\n✅ Production admin setup completed successfully!')
    console.log('\n📝 Next Steps:')
    console.log('   1. Deploy the application to production')
    console.log('   2. Access admin panel at: /admin-auth/signin')
    console.log('   3. Use the credentials above to sign in')
    console.log('   4. Manage admin users through /api/admin/manage')

  } catch (error) {
    console.error('❌ Error setting up production admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupProductionAdmin()
