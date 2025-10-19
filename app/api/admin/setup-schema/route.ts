import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Setting up production admin system...')
    
    // Step 1: Add isAdmin column to users table
    console.log('📊 Updating database schema...')
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false`
      console.log('✅ Added isAdmin column to users table')
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
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
      console.log(`   • ${user.email} (${user.name || 'No name'}) - Created: ${user.createdAt ? user.createdAt.toLocaleDateString() : 'Unknown'}`)
    })

    return NextResponse.json({
      success: true,
      message: 'Production admin setup completed successfully!',
      adminUsers: adminUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }))
    })

  } catch (error) {
    console.error('❌ Error setting up production admin:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup production admin', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
