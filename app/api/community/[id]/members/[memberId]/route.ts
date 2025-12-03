import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  checkCommunityPermission, 
  getUserCommunityRole,
  canManageCommunityRole,
  getAssignableCommunityRoles,
} from '@/lib/middleware/community-permissions'
import { CommunityRole } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/community/[id]/members/[memberId]
 * Update member role
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
    const userEmail = (session.user as any).email
    const communityId = params.id
    const memberId = params.memberId
    const body = await request.json()
    const { role } = body

    console.log('[Community Role Update] Session info:', {
      userId,
      userEmail,
      sessionUser: session.user,
    })

    // Validate role
    const validRoles: CommunityRole[] = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']
    if (!validRoles.includes(role as CommunityRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get the member to update
    const memberToUpdate = await prisma.communityMember.findUnique({
      where: { id: memberId },
      include: {
        community: true,
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

    if (memberToUpdate.communityId !== communityId) {
      return NextResponse.json({ error: 'Member does not belong to this community' }, { status: 400 })
    }

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, email: true, adminRole: true },
    })

    console.log('[Community Role Update] User check:', {
      userId,
      email: user?.email,
      isAdmin: user?.isAdmin,
      adminRole: user?.adminRole,
    })

    // Super admins can manage all roles, otherwise check permission
    if (!user?.isAdmin) {
      const userRole = await getUserCommunityRole(userId, communityId)
      if (!userRole) {
        return NextResponse.json({ error: 'User is not a member' }, { status: 403 })
      }

      // Check permission
      if (!(await checkCommunityPermission(userId, communityId, 'canManageRoles'))) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      // Check if user can manage this role
      if (!canManageCommunityRole(userRole, role as CommunityRole)) {
        return NextResponse.json({ error: 'Cannot assign this role' }, { status: 403 })
      }

      // Check if trying to change ADMIN role (only ADMIN can change ADMIN)
      if (memberToUpdate.role === 'ADMIN' && userRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Only ADMIN can modify ADMIN role' }, { status: 403 })
      }
    }

    // Prevent removing the last ADMIN
    if (memberToUpdate.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.communityMember.count({
        where: {
          communityId,
          role: 'ADMIN',
        },
      })

      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last ADMIN' }, { status: 400 })
      }
    }

    // Update the role
    const updatedMember = await prisma.communityMember.update({
      where: { id: memberId },
      data: { role: role as CommunityRole },
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

    // If user is promoted to ADMIN, automatically add them as ADMIN to all buildings in the community
    if (role === 'ADMIN' && memberToUpdate.role !== 'ADMIN') {
      try {
        // Get all buildings in this community
        const buildings = await prisma.building.findMany({
          where: { communityId },
          select: { id: true },
        })

        // Add user as ADMIN to all buildings (skip if already a member)
        for (const building of buildings) {
          const existingBuildingMembership = await prisma.buildingMember.findUnique({
            where: {
              userId_buildingId: {
                userId: memberToUpdate.userId,
                buildingId: building.id,
              },
            },
          })

          if (!existingBuildingMembership) {
            await prisma.buildingMember.create({
              data: {
                userId: memberToUpdate.userId,
                buildingId: building.id,
                role: 'ADMIN',
                memberClass: 'community', // Mark as community-level admin
              },
            })
          } else if (existingBuildingMembership.role !== 'ADMIN') {
            // Update existing membership to ADMIN if not already
            await prisma.buildingMember.update({
              where: {
                userId_buildingId: {
                  userId: memberToUpdate.userId,
                  buildingId: building.id,
                },
              },
              data: {
                role: 'ADMIN',
                memberClass: 'community',
              },
            })
          }
        }
      } catch (error) {
        console.error('Error auto-adding community admin to buildings:', error)
        // Don't fail the request if auto-adding to buildings fails
        // The community membership was already updated successfully
      }
    }

    return NextResponse.json({
      id: updatedMember.id,
      role: updatedMember.role,
      joinedAt: updatedMember.joinedAt,
      user: updatedMember.user,
    })
  } catch (error) {
    console.error('Error updating community member role:', error)
    return NextResponse.json(
      { error: 'Failed to update community member role' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/community/[id]/members/[memberId]
 * Remove member from community
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const memberId = params.memberId

    // Get the member to delete
    const memberToDelete = await prisma.communityMember.findUnique({
      where: { id: memberId },
    })

    if (!memberToDelete) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (memberToDelete.communityId !== communityId) {
      return NextResponse.json({ error: 'Member does not belong to this community' }, { status: 400 })
    }

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    // Super admins can remove members, otherwise check permission
    if (!user?.isAdmin) {
      if (!(await checkCommunityPermission(userId, communityId, 'canRemoveMembers'))) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Prevent removing the last ADMIN
    if (memberToDelete.role === 'ADMIN') {
      const adminCount = await prisma.communityMember.count({
        where: {
          communityId,
          role: 'ADMIN',
        },
      })

      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last ADMIN' }, { status: 400 })
      }
    }

    // Prevent users from removing themselves (use leave endpoint instead)
    if (memberToDelete.userId === userId) {
      return NextResponse.json({ error: 'Cannot remove yourself. Use leave endpoint instead.' }, { status: 400 })
    }

    // Delete membership
    await prisma.communityMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing community member:', error)
    return NextResponse.json(
      { error: 'Failed to remove community member' },
      { status: 500 }
    )
  }
}

