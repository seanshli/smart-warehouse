import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityPermission, isCommunityMember } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/community/[id]/working-groups/[groupId]/members
 * Get all members of a working group
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

    // Check if user is a member of the community
    if (!(await isCommunityMember(userId, communityId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Verify working group belongs to community
    const workingGroup = await prisma.workingGroup.findUnique({
      where: { id: groupId },
    })

    if (!workingGroup) {
      return NextResponse.json({ error: 'Working group not found' }, { status: 404 })
    }

    if (workingGroup.communityId !== communityId) {
      return NextResponse.json({ error: 'Working group does not belong to this community' }, { status: 400 })
    }

    const members = await prisma.workingGroupMember.findMany({
      where: { workingGroupId: groupId },
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
      orderBy: {
        assignedAt: 'asc',
      },
    })

    return NextResponse.json({
      members: members.map(m => ({
        id: m.id,
        role: m.role,
        assignedAt: m.assignedAt,
        user: m.user,
      })),
    })
  } catch (error) {
    console.error('Error fetching working group members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch working group members' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/community/[id]/working-groups/[groupId]/members
 * Add a member to the working group
 */
export async function POST(
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
    const { targetUserId, targetUserEmail, role = 'MEMBER' } = body

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    // Super admins can assign working group members, otherwise check permission
    if (!user?.isAdmin) {
      if (!(await checkCommunityPermission(userId, communityId, 'canAssignWorkingGroupMembers'))) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Verify working group belongs to community
    const workingGroup = await prisma.workingGroup.findUnique({
      where: { id: groupId },
    })

    if (!workingGroup) {
      return NextResponse.json({ error: 'Working group not found' }, { status: 404 })
    }

    if (workingGroup.communityId !== communityId) {
      return NextResponse.json({ error: 'Working group does not belong to this community' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['LEADER', 'MEMBER']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Find target user
    let targetUser = null
    if (targetUserId) {
      targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      })
    } else if (targetUserEmail) {
      // Normalize email (trim and lowercase)
      const normalizedEmail = targetUserEmail.trim().toLowerCase()
      targetUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
      
      // If not found with normalized email, try original email (case-sensitive)
      if (!targetUser) {
        targetUser = await prisma.user.findUnique({
          where: { email: targetUserEmail.trim() },
        })
      }
    }

    if (!targetUser) {
      const searchEmail = targetUserEmail || 'unknown'
      console.error(`User not found: ${searchEmail}`)
      return NextResponse.json({ 
        error: 'User not found',
        details: `The user with email "${searchEmail}" must exist in the system before they can be added as a working group member.`,
        steps: [
          '1. Go to Admin → Users page to create the user first',
          '2. Then return here to add them to this working group'
        ],
        helpUrl: '/admin/users',
        helpText: 'Go to Admin Users page to create user →'
      }, { status: 404 })
    }

    // Check if user is a member of the community
    let isMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: targetUser.id,
          communityId,
        },
      },
    })

    // If user is not a community member, automatically create community membership
    // This ensures consistency when adding working group members from building admin
    if (!isMember) {
      try {
        // Get building from working group's community to determine memberClass
        const building = await prisma.building.findFirst({
          where: { communityId },
          select: { id: true },
        })

        // Try to create community membership with memberClass
        try {
          isMember = await prisma.communityMember.create({
            data: {
              userId: targetUser.id,
              communityId,
              role: 'MEMBER',
              memberClass: 'building', // Default to 'building' for working group members
            },
          })
          console.log('[Add Working Group Member] Auto-created community membership:', {
            userId: targetUser.id,
            communityId,
          })
        } catch (memberClassError: any) {
          // If memberClass column doesn't exist, create without it
          if (memberClassError.message?.includes('member_class') || memberClassError.code === 'P2022') {
            isMember = await prisma.communityMember.create({
              data: {
                userId: targetUser.id,
                communityId,
                role: 'MEMBER',
              },
            })
          } else {
            throw memberClassError
          }
        }
      } catch (createError: any) {
        console.error('[Add Working Group Member] Error auto-creating community membership:', createError)
        // If creation fails, still allow adding to working group but warn user
        // Don't block the operation - the user can be added to working group even if community membership fails
      }
    }

    // Check if user is already a member of the working group
    const existingMembership = await prisma.workingGroupMember.findUnique({
      where: {
        workingGroupId_userId: {
          workingGroupId: groupId,
          userId: targetUser.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member of this working group' }, { status: 400 })
    }

    // Create membership
    const membership = await prisma.workingGroupMember.create({
      data: {
        workingGroupId: groupId,
        userId: targetUser.id,
        role: role as 'LEADER' | 'MEMBER',
      },
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
      id: membership.id,
      role: membership.role,
      assignedAt: membership.assignedAt,
      user: membership.user,
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding working group member:', error)
    return NextResponse.json(
      { error: 'Failed to add working group member' },
      { status: 500 }
    )
  }
}

