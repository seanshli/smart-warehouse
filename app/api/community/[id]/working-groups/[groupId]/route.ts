import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityPermission, isCommunityMember } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/community/[id]/working-groups/[groupId]
 * Get working group details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const groupId = params.groupId

    // Check if user is a member
    if (!(await isCommunityMember(userId, communityId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const workingGroup = await prisma.workingGroup.findUnique({
      where: { id: groupId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
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
        },
        permissions: true,
        _count: {
          select: {
            members: true,
            permissions: true,
          },
        },
      },
    })

    if (!workingGroup) {
      return NextResponse.json({ error: 'Working group not found' }, { status: 404 })
    }

    if (workingGroup.communityId !== communityId) {
      return NextResponse.json({ error: 'Working group does not belong to this community' }, { status: 400 })
    }

    return NextResponse.json({
      id: workingGroup.id,
      name: workingGroup.name,
      description: workingGroup.description,
      type: workingGroup.type,
      community: workingGroup.community,
      members: workingGroup.members.map(m => ({
        id: m.id,
        role: m.role,
        assignedAt: m.assignedAt,
        user: m.user,
      })),
      permissions: workingGroup.permissions,
      stats: {
        members: workingGroup._count.members,
        permissions: workingGroup._count.permissions,
      },
      createdAt: workingGroup.createdAt,
      updatedAt: workingGroup.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching working group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch working group' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/community/[id]/working-groups/[groupId]
 * Update working group
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const groupId = params.groupId
    const body = await request.json()

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    // Super admins can edit working groups, otherwise check permission
    if (!user?.isAdmin) {
      if (!(await checkCommunityPermission(userId, communityId, 'canEditWorkingGroups'))) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    const { name, description, type } = body

    const updated = await prisma.workingGroup.update({
      where: { id: groupId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating working group:', error)
    return NextResponse.json(
      { error: 'Failed to update working group' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/community/[id]/working-groups/[groupId]
 * Delete working group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const groupId = params.groupId

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    // Super admins can delete working groups, otherwise check permission
    if (!user?.isAdmin) {
      if (!(await checkCommunityPermission(userId, communityId, 'canDeleteWorkingGroups'))) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    await prisma.workingGroup.delete({
      where: { id: groupId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting working group:', error)
    return NextResponse.json(
      { error: 'Failed to delete working group' },
      { status: 500 }
    )
  }
}

