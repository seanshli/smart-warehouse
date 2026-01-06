import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user has admin access
    const userId = (session.user as any).id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, adminRole: true }
    })

    const isSuperAdmin = user?.isAdmin && user.adminRole === 'SUPERUSER'
    
    // Check if user is community or building admin
    const [communityMemberships, buildingMemberships] = await Promise.all([
      prisma.communityMember.findMany({
        where: {
          userId,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
        select: { communityId: true },
      }),
      prisma.buildingMember.findMany({
        where: {
          userId,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
        select: { buildingId: true },
      }),
    ])

    const hasAdminAccess = isSuperAdmin || 
                          communityMemberships.length > 0 || 
                          buildingMemberships.length > 0

    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only super admins can modify roles
    const userId = (session.user as any).id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, adminRole: true }
    })

    if (!user?.isAdmin || user.adminRole !== 'SUPERUSER') {
      return NextResponse.json({ error: 'Superuser privileges required to modify roles' }, { status: 403 })
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const currentUserId = (session.user as any).id

    // Only super admins can delete admin users
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, isAdmin: true, adminRole: true }
    })

    if (!currentUser?.isAdmin || currentUser.adminRole !== 'SUPERUSER') {
      return NextResponse.json({ error: 'Superuser privileges required to delete admin users' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Prevent deleting yourself
    if (userId === currentUserId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Get the user to delete
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, isAdmin: true, adminRole: true }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting the last superuser
    if (userToDelete.isAdmin && userToDelete.adminRole === 'SUPERUSER') {
      const superuserCount = await prisma.user.count({
        where: {
          isAdmin: true,
          adminRole: 'SUPERUSER'
        }
      })

      if (superuserCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last superuser' }, { status: 400 })
      }
    }

    // Remove admin privileges (set isAdmin to false) instead of deleting the user
    // This preserves the user account but removes admin access
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isAdmin: false,
        adminRole: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        adminRole: true
      }
    })

    console.log(`[Admin] Removed admin privileges from user: ${updatedUser.email}`)

    return NextResponse.json({
      success: true,
      message: 'Admin privileges removed successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error removing admin privileges:', error)
    return NextResponse.json(
      { error: 'Failed to remove admin privileges', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
