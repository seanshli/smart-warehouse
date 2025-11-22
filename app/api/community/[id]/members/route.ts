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
 * GET /api/community/[id]/members
 * Get all community members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id

    // Check permission
    if (!(await checkCommunityPermission(userId, communityId, 'canViewMembers'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const userRole = await getUserCommunityRole(userId, communityId)
    if (!userRole) {
      return NextResponse.json({ error: 'User is not a member' }, { status: 403 })
    }

    const members = await prisma.communityMember.findMany({
      where: { communityId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    })

    return NextResponse.json({
      members: members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user,
        canManage: canManageCommunityRole(userRole, (member.role || 'MEMBER') as CommunityRole),
      })),
      assignableRoles: getAssignableCommunityRoles(userRole),
    })
  } catch (error) {
    console.error('Error fetching community members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community members' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/community/[id]/members
 * Add a member to the community
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const body = await request.json()
    const { targetUserId, targetUserEmail, role = 'MEMBER' } = body

    // Check permission
    if (!(await checkCommunityPermission(userId, communityId, 'canAddMembers'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const userRole = await getUserCommunityRole(userId, communityId)
    if (!userRole) {
      return NextResponse.json({ error: 'User is not a member' }, { status: 403 })
    }

    // Validate role
    const validRoles: CommunityRole[] = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']
    if (!validRoles.includes(role as CommunityRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user can assign this role
    if (!canManageCommunityRole(userRole, role as CommunityRole)) {
      return NextResponse.json({ error: 'Cannot assign this role' }, { status: 403 })
    }

    // Find target user
    let targetUser = null
    if (targetUserId) {
      targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      })
    } else if (targetUserEmail) {
      targetUser = await prisma.user.findUnique({
        where: { email: targetUserEmail },
      })
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: targetUser.id,
          communityId,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Create membership
    const membership = await prisma.communityMember.create({
      data: {
        userId: targetUser.id,
        communityId,
        role: role as CommunityRole,
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
      joinedAt: membership.joinedAt,
      user: membership.user,
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding community member:', error)
    return NextResponse.json(
      { error: 'Failed to add community member' },
      { status: 500 }
    )
  }
}

