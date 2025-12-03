import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/building/[id]/members/[memberId]
 * Update building member role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const buildingId = params.id
    const memberId = params.memberId
    const body = await request.json()
    const { role } = body

    // Validate role
    const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get the member to update
    const memberToUpdate = await prisma.buildingMember.findUnique({
      where: { id: memberId },
      include: {
        building: {
          include: {
            community: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (memberToUpdate.buildingId !== buildingId) {
      return NextResponse.json({ error: 'Member does not belong to this building' }, { status: 400 })
    }

    // Check permissions
    // 1. Super admin can do anything
    // 2. Community ADMIN/MANAGER can modify building members
    // 3. Building ADMIN/MANAGER can modify building members
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, email: true, adminRole: true },
    })

    console.log('[Building Role Update] User check:', {
      userId,
      email: currentUser?.email,
      isAdmin: currentUser?.isAdmin,
      adminRole: currentUser?.adminRole,
      buildingId,
      memberId,
    })

    let hasPermission = false

    if (currentUser?.isAdmin) {
      hasPermission = true
      console.log('[Building Role Update] ✅ Super admin detected - permission granted')
    } else {
      // Check if user is community admin/manager
      const communityMembership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: userId,
            communityId: memberToUpdate.building.communityId,
          },
        },
      })

      if (communityMembership && (communityMembership.role === 'ADMIN' || communityMembership.role === 'MANAGER')) {
        hasPermission = true
      } else {
        // Check if user is building admin/manager
        const buildingMembership = await prisma.buildingMember.findUnique({
          where: {
            userId_buildingId: {
              userId: userId,
              buildingId: buildingId,
            },
          },
        })

        if (buildingMembership && (buildingMembership.role === 'ADMIN' || buildingMembership.role === 'MANAGER')) {
          hasPermission = true
        }
      }
    }

    if (!hasPermission) {
      console.log('[Building Role Update] ❌ Permission denied:', {
        userId,
        email: currentUser?.email,
        isAdmin: currentUser?.isAdmin,
        buildingId,
        memberId,
      })
      return NextResponse.json({ 
        error: 'Insufficient permissions to modify building member roles',
        debug: {
          userId,
          email: currentUser?.email,
          isAdmin: currentUser?.isAdmin,
        }
      }, { status: 403 })
    }

    // Prevent removing the last ADMIN
    if (memberToUpdate.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.buildingMember.count({
        where: {
          buildingId,
          role: 'ADMIN',
        },
      })

      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last ADMIN' }, { status: 400 })
      }
    }

    // Update the role
    const updatedMember = await prisma.buildingMember.update({
      where: { id: memberId },
      data: { role: role as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: updatedMember.id,
      role: updatedMember.role,
      joinedAt: updatedMember.joinedAt,
      user: updatedMember.user,
    })
  } catch (error) {
    console.error('Error updating building member role:', error)
    return NextResponse.json(
      { error: 'Failed to update building member role' },
      { status: 500 }
    )
  }
}

