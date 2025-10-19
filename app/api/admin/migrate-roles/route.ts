import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Setting up admin roles system...')
    
    // Step 1: Add admin_role column to users table
    console.log('📊 Adding admin_role column...')
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS "admin_role" TEXT DEFAULT 'SUPERUSER'`
      console.log('✅ Added admin_role column to users table')
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('✅ admin_role column already exists')
      } else {
        throw error
      }
    }

    // Step 2: Update existing admin users to have SUPERUSER role
    console.log('👤 Updating existing admin users...')
    try {
      await prisma.$executeRaw`
        UPDATE users 
        SET "admin_role" = 'SUPERUSER' 
        WHERE "isAdmin" = true AND "admin_role" IS NULL
      `
      console.log('✅ Updated existing admin users to SUPERUSER role')
    } catch (error) {
      console.log('ℹ️ Admin role update skipped')
    }

    // Step 3: Set default roles for specific admin users
    console.log('🎯 Setting specific admin roles...')
    try {
      // Set seanshlitw@gmail.com as SUPERUSER
      await prisma.$executeRaw`
        UPDATE users 
        SET "admin_role" = 'SUPERUSER' 
        WHERE email = 'seanshlitw@gmail.com'
      `
      
      // Set admin@smartwarehouse.com as SUPERUSER
      await prisma.$executeRaw`
        UPDATE users 
        SET "admin_role" = 'SUPERUSER' 
        WHERE email = 'admin@smartwarehouse.com'
      `
      
      console.log('✅ Set specific admin roles')
    } catch (error) {
      console.log('ℹ️ Specific admin role setting skipped')
    }

    // Step 4: Verify admin users
    console.log('🔍 Verifying admin users...')
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        adminRole: true,
        language: true,
        createdAt: true
      }
    })

    console.log('\n📋 Admin Users with Roles:')
    adminUsers.forEach(user => {
      console.log(`   • ${user.email} - Role: ${user.adminRole || 'SUPERUSER'} - Language: ${user.language || 'en'}`)
    })

    return NextResponse.json({
      success: true,
      message: 'Admin roles system setup completed successfully!',
      adminUsers: adminUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        adminRole: user.adminRole || 'SUPERUSER',
        language: user.language || 'en',
        createdAt: user.createdAt
      })),
      availableRoles: [
        {
          value: 'SUPERUSER',
          label: 'Superuser',
          description: 'Full access to all admin functions'
        },
        {
          value: 'USER_MANAGEMENT',
          label: 'User Management',
          description: 'Manage user accounts and passwords'
        },
        {
          value: 'ITEM_MANAGEMENT',
          label: 'Item Management',
          description: 'Manage items and duplicate detection'
        },
        {
          value: 'HOUSEHOLD_MODIFICATION',
          label: 'Household Modification',
          description: 'Manage households and members'
        }
      ]
    })

  } catch (error) {
    console.error('❌ Error setting up admin roles system:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup admin roles system', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
