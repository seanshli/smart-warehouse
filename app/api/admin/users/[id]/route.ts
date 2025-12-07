import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users/[id] - Get a single user with all memberships
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { isAdmin: true }
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id: userId } = params

    // Fetch user with all memberships
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        contact: true,
        language: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch all memberships in parallel
    const [
      householdMemberships,
      communityMemberships,
      buildingMemberships,
      workingGroupMembers
    ] = await Promise.all([
      prisma.householdMember.findMany({
        where: { userId },
        include: {
          household: {
            include: {
              building: {
                select: {
                  id: true,
                  name: true,
                  community: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      }).catch(() => []),
      prisma.communityMember.findMany({
        where: { userId },
        include: {
          community: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }).catch(() => []),
      prisma.buildingMember.findMany({
        where: { userId },
        include: {
          building: {
            include: {
              community: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }).catch(() => []),
      prisma.workingGroupMember.findMany({
        where: { userId },
        include: {
          workingGroup: {
            select: {
              id: true,
              name: true,
              type: true,
              communityId: true
            }
          }
        }
      }).catch(() => [])
    ])

    // Transform the response to match the User interface
    const transformedUser = {
      ...user,
      households: householdMemberships.map(membership => ({
        id: membership.household.id,
        name: membership.household.name,
        role: membership.role,
        joinedAt: membership.joinedAt?.toISOString() || new Date().toISOString(),
        building: membership.household.building ? {
          id: membership.household.building.id,
          name: membership.household.building.name,
          community: membership.household.building.community
        } : undefined
      })),
      communities: communityMemberships.map(membership => ({
        membershipId: membership.id,
        id: membership.community.id,
        name: membership.community.name,
        role: membership.role || 'MEMBER',
        memberClass: membership.memberClass || 'household',
        joinedAt: membership.joinedAt?.toISOString() || new Date().toISOString()
      })),
      buildings: buildingMemberships.map(membership => ({
        membershipId: membership.id,
        id: membership.building.id,
        name: membership.building.name,
        role: membership.role || 'MEMBER',
        memberClass: membership.memberClass || 'household',
        communityId: membership.building.communityId,
        community: membership.building.community,
        joinedAt: membership.joinedAt?.toISOString() || new Date().toISOString()
      })),
      workingGroups: workingGroupMembers.map(membership => ({
        id: membership.workingGroup.id,
        name: membership.workingGroup.name,
        type: membership.workingGroup.type,
        role: membership.role,
        assignedAt: membership.assignedAt?.toISOString() || new Date().toISOString()
      }))
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
