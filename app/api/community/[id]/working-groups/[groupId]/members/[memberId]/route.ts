import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityPermission } from '@/lib/middleware/community-permissions'
import { canManageUser } from '@/lib/middleware/admin-user-permissions'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/community/[id]/working-groups/[groupId]/members/[memberId]
 * Update working group member (role, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const groupId = params.groupId
    const memberId = params.memberId

    // Check permissions - super admin or community/building admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    let hasPermission = false
    if (user?.isAdmin) {
      hasPermission = true
    } else {
      // Check community admin
      const communityMember = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId,
          },
        },
        select: { role: true },
      })
      if (communityMember && ['ADMIN', 'MANAGER'].includes(communityMember.role || '')) {
        hasPermission = true
      }

      // Check building admin (through community)
      if (!hasPermission) {
        const buildings = await prisma.building.findMany({
          where: { communityId },
          select: { id: true },
        })
        for (const building of buildings) {
          const buildingMember = await prisma.buildingMember.findUnique({
            where: {
              userId_buildingId: {
                userId,
                buildingId: building.id,
              },
            },
            select: { role: true },
          })
          if (buildingMember && ['ADMIN', 'MANAGER'].includes(buildingMember.role || '')) {
            hasPermission = true
            break
          }
        }
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get the member to update
    const memberToUpdate = await prisma.workingGroupMember.findUnique({
      where: { id: memberId },
      include: {
        workingGroup: true,
        user: {
          select: { id: true },
        },
      },
    })

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (memberToUpdate.workingGroupId !== groupId) {
      return NextResponse.json({ error: 'Member does not belong to this working group' }, { status: 400 })
    }

    if (memberToUpdate.workingGroup.communityId !== communityId) {
      return NextResponse.json({ error: 'Working group does not belong to this community' }, { status: 400 })
    }

    const body = await request.json()
    const { role } = body

    // Validate role
    const validRoles = ['LEADER', 'MEMBER']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Update member
    const updatedMember = await prisma.workingGroupMember.update({
      where: { id: memberId },
      data: {
        ...(role && { role }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating working group member:', error)
    return NextResponse.json(
      { error: 'Failed to update working group member' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/community/[id]/working-groups/[groupId]/members/[memberId]
 * Remove member from working group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const groupId = params.groupId
    const memberId = params.memberId

    // Check permissions - super admin or community/building admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    let hasPermission = false
    if (user?.isAdmin) {
      hasPermission = true
    } else {
      // Check community admin
      const communityMember = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId,
          },
        },
        select: { role: true },
      })
      if (communityMember && ['ADMIN', 'MANAGER'].includes(communityMember.role || '')) {
        hasPermission = true
      }

      // Check building admin (through community)
      if (!hasPermission) {
        const buildings = await prisma.building.findMany({
          where: { communityId },
          select: { id: true },
        })
        for (const building of buildings) {
          const buildingMember = await prisma.buildingMember.findUnique({
            where: {
              userId_buildingId: {
                userId,
                buildingId: building.id,
              },
            },
            select: { role: true },
          })
          if (buildingMember && ['ADMIN', 'MANAGER'].includes(buildingMember.role || '')) {
            hasPermission = true
            break
          }
        }
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get the member to delete
    const memberToDelete = await prisma.workingGroupMember.findUnique({
      where: { id: memberId },
      include: {
        workingGroup: true,
      },
    })

    if (!memberToDelete) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (memberToDelete.workingGroupId !== groupId) {
      return NextResponse.json({ error: 'Member does not belong to this working group' }, { status: 400 })
    }

    if (memberToDelete.workingGroup.communityId !== communityId) {
      return NextResponse.json({ error: 'Working group does not belong to this community' }, { status: 400 })
    }

    // Delete membership
    await prisma.workingGroupMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing working group member:', error)
    return NextResponse.json(
      { error: 'Failed to remove working group member' },
      { status: 500 }
    )
  }
}

