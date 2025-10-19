import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { storeUserPassword } from '@/lib/credentials'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up admin users...')
    
    // Update existing user to admin
    const existingUser = await prisma.user.findUnique({
      where: { email: 'seanshlitw@gmail.com' }
    })

    if (existingUser) {
      await prisma.user.update({
        where: { email: 'seanshlitw@gmail.com' },
        data: { isAdmin: true }
      })
      console.log('Updated seanshlitw@gmail.com to admin')
    }

    // Create or update admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@smartwarehouse.com' }
    })

    if (adminUser) {
      await prisma.user.update({
        where: { email: 'admin@smartwarehouse.com' },
        data: { isAdmin: true }
      })
      console.log('Updated admin@smartwarehouse.com to admin')
    } else {
      await prisma.user.create({
        data: {
          email: 'admin@smartwarehouse.com',
          name: 'System Administrator',
          isAdmin: true,
        }
      })
      console.log('Created admin@smartwarehouse.com admin user')
    }

    // Ensure passwords are stored in the credential system
    const adminPasswordHash = await bcrypt.hash('admin123', 12)
    storeUserPassword('admin@smartwarehouse.com', adminPasswordHash)

    return NextResponse.json({
      message: 'Admin users setup successfully',
      adminUsers: [
        {
          email: 'admin@smartwarehouse.com',
          password: 'admin123',
          name: 'System Administrator'
        },
        {
          email: 'seanshlitw@gmail.com',
          password: 'smtengo888',
          name: 'Sean Li'
        }
      ]
    })

  } catch (error) {
    console.error('Error setting up admin users:', error)
    return NextResponse.json(
      { error: 'Failed to setup admin users', details: error.message },
      { status: 500 }
    )
  }
}
