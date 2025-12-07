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
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    // Handle both Promise and direct params (Next.js 14 vs 15)
    const resolvedParams = params instanceof Promise ? await params : params
    const userId = resolvedParams.id

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ 
        error: 'Invalid user ID format',
        details: 'User ID must be a valid UUID'
      }, { status: 400 })
    }

    // Fetch user with all memberships (reuse logic from existing GET endpoint)
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
      }).catch((err) => {
        console.error('[Get User] Error fetching household memberships:', err)
        return []
      }),
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
      }).catch((err) => {
        console.error('[Get User] Error fetching community memberships:', err)
        return []
      }),
      prisma.buildingMember.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          buildingId: true,
          role: true,
          joinedAt: true,
          building: {
            select: {
              id: true,
              name: true,
              communityId: true,
              community: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }).catch((err) => {
        console.error('[Get User] Error fetching building memberships:', err)
        return []
      }),
      prisma.workingGroupMember.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          workingGroupId: true,
          role: true,
          assignedAt: true,
          workingGroup: {
            select: {
              id: true,
              name: true,
              type: true,
              communityId: true
            }
          }
        }
      }).catch((err) => {
        console.error('[Get User] Error fetching working group memberships:', err)
        return []
      })
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
        memberClass: (membership as any).memberClass || 'household', // Use any cast since column might not exist
        joinedAt: membership.joinedAt?.toISOString() || new Date().toISOString()
      })),
      buildings: buildingMemberships
        .filter(membership => membership.building) // Filter out any null buildings
        .map(membership => ({
          membershipId: membership.id,
          id: membership.building!.id,
          name: membership.building!.name,
          role: membership.role || 'MEMBER',
          memberClass: (membership as any).memberClass || 'household', // Use any cast since column might not exist
          communityId: membership.building!.communityId,
          community: membership.building!.community || null,
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
    console.error('[Get User] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch user', details: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id] - Delete a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    // Handle both Promise and direct params (Next.js 14 vs 15)
    const resolvedParams = params instanceof Promise ? await params : params
    const userId = resolvedParams.id

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ 
        error: 'Invalid user ID format',
        details: 'User ID must be a valid UUID'
      }, { status: 400 })
    }

    console.log('[Delete User] Request:', { userId, deletedBy: (session.user as any).id })

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent self-deletion
    if (userId === (session.user as any).id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    })

    console.log('[Delete User] Success:', { userId, email: user.email })

    return NextResponse.json({ 
      message: 'User deleted successfully',
      userId 
    })
  } catch (error) {
    console.error('[Delete User] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('[Delete User] Error details:', {
      errorMessage,
      errorDetails
    })
    
    // Check if it's a foreign key constraint error
    if (errorMessage.includes('Foreign key constraint') || errorMessage.includes('P2003')) {
      return NextResponse.json(
        { 
          error: 'Cannot delete user. User has associated records that must be removed first.',
          details: 'Please remove all memberships, items, and other associations before deleting.'
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
