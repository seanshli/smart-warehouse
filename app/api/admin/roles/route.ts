import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is superuser
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, adminRole: true }
    })

    if (!user?.isAdmin || user.adminRole !== 'SUPERUSER') {
      return NextResponse.json({ error: 'Superuser privileges required' }, { status: 403 })
    }

    // Get all admin users with their roles
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
        adminRole: true,
        language: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      adminUsers,
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
    console.error('Error fetching admin roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin roles', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is superuser
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, adminRole: true }
    })

    if (!user?.isAdmin || user.adminRole !== 'SUPERUSER') {
      return NextResponse.json({ error: 'Superuser privileges required' }, { status: 403 })
    }

    const { userId, adminRole, language } = await request.json()

    if (!userId || !adminRole) {
      return NextResponse.json({ error: 'User ID and admin role are required' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['SUPERUSER', 'USER_MANAGEMENT', 'ITEM_MANAGEMENT', 'HOUSEHOLD_MODIFICATION']
    if (!validRoles.includes(adminRole)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 400 })
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        adminRole,
        ...(language && { language })
      },
      select: {
        id: true,
        email: true,
        name: true,
        adminRole: true,
        language: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating admin role:', error)
    return NextResponse.json(
      { error: 'Failed to update admin role', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
