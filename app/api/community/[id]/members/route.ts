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

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    // Super admins can view all members, otherwise check permission
    if (!user?.isAdmin) {
      if (!(await checkCommunityPermission(userId, communityId, 'canViewMembers'))) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      const userRole = await getUserCommunityRole(userId, communityId)
      if (!userRole) {
        return NextResponse.json({ error: 'User is not a member' }, { status: 403 })
      }
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

    // Get user role for permission checks (super admin has all permissions)
    const effectiveRole = user?.isAdmin ? 'ADMIN' : await getUserCommunityRole(userId, communityId)
    const userRole = (effectiveRole || 'MEMBER') as CommunityRole

    return NextResponse.json({
      members: members.map(member => ({
        id: member.id,
        role: member.role,
        memberClass: member.memberClass || 'household',
        joinedAt: member.joinedAt,
        user: member.user,
        canManage: user?.isAdmin || canManageCommunityRole(userRole, (member.role || 'MEMBER') as CommunityRole),
      })),
      assignableRoles: user?.isAdmin ? ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'] : getAssignableCommunityRoles(userRole),
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
    const { targetUserId, targetUserEmail, role = 'MEMBER', memberClass = 'household' } = body

    // Check if user is super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    // Validate role - ADMIN, MANAGER, MEMBER, VIEWER
    const validRoles: CommunityRole[] = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']
    if (!validRoles.includes(role as CommunityRole)) {
      return NextResponse.json({ error: 'Invalid role. Must be: ADMIN, MANAGER, MEMBER, or VIEWER' }, { status: 400 })
    }

    // Validate memberClass
    const validClasses = ['household', 'building', 'community']
    if (!validClasses.includes(memberClass)) {
      return NextResponse.json({ error: 'Invalid member class. Must be: household, building, or community' }, { status: 400 })
    }

    // Super admins can add members, otherwise check permission
    if (!currentUser?.isAdmin) {
      if (!(await checkCommunityPermission(userId, communityId, 'canAddMembers'))) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      const userRole = await getUserCommunityRole(userId, communityId)
      if (!userRole) {
        return NextResponse.json({ error: 'User is not a member' }, { status: 403 })
      }

      // Check if user can assign this role
      if (!canManageCommunityRole(userRole, role as CommunityRole)) {
        return NextResponse.json({ error: 'Cannot assign this role' }, { status: 403 })
      }
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
        memberClass: memberClass as 'household' | 'building' | 'community',
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

    // If user is added as ADMIN, automatically add them as ADMIN to all buildings in the community
    // COMMUNITY ADMIN -> BUILDING ADMIN (not MANAGER)
    if (role === 'ADMIN') {
      try {
        // Get all buildings in this community
        const buildings = await prisma.building.findMany({
          where: { communityId },
          select: { id: true },
        })

        // Add user as ADMIN to all buildings
        // Skip if already a member with ADMIN role
        for (const building of buildings) {
          const existingBuildingMembership = await prisma.buildingMember.findUnique({
            where: {
              userId_buildingId: {
                userId: targetUser.id,
                buildingId: building.id,
              },
            },
          })

          if (!existingBuildingMembership) {
            await prisma.buildingMember.create({
              data: {
                userId: targetUser.id,
                buildingId: building.id,
                role: 'ADMIN', // Always ADMIN for community admins
                memberClass: 'community', // Mark as community-level admin
              },
            })
          } else if (existingBuildingMembership.role !== 'ADMIN') {
            // Update existing membership to ADMIN if not already ADMIN
            // Role hierarchy: ADMIN > MANAGER > MEMBER > VIEWER
            const roleHierarchy: Record<string, number> = { 'ADMIN': 4, 'MANAGER': 3, 'MEMBER': 2, 'VIEWER': 1 }
            const currentRoleLevel = roleHierarchy[existingBuildingMembership.role || 'MEMBER'] || 0
            const adminRoleLevel = roleHierarchy['ADMIN'] || 0

            if (adminRoleLevel > currentRoleLevel) {
              await prisma.buildingMember.update({
                where: {
                  userId_buildingId: {
                    userId: targetUser.id,
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
        }
      } catch (error) {
        console.error('Error auto-adding community admin to buildings:', error)
        // Don't fail the request if auto-adding to buildings fails
        // The community membership was already created successfully
      }
    }

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

