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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      console.error('[Community Members API] Unauthorized - no session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    // Handle both Promise and direct params (Next.js 14 vs 15)
    const resolvedParams = params instanceof Promise ? await params : params
    const communityId = resolvedParams.id
    
    console.log('[Community Members API] Request:', { userId, communityId })

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    // Super admins can view all members, otherwise check permission
    if (!user?.isAdmin) {
      // Check if user is a member first
      const userRole = await getUserCommunityRole(userId, communityId)
      if (!userRole) {
        return NextResponse.json({ 
          error: 'You are not a member of this community. Please join the community first.' 
        }, { status: 403 })
      }

      // Then check if user has permission to view members
      if (!(await checkCommunityPermission(userId, communityId, 'canViewMembers'))) {
        return NextResponse.json({ 
          error: 'Insufficient permissions. You do not have permission to view community members.' 
        }, { status: 403 })
      }
    }

    let members
    try {
      members = await prisma.communityMember.findMany({
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
    } catch (prismaError: any) {
      console.error('Prisma error fetching community members:', prismaError)
      // If there's a foreign key constraint issue, try fetching without user relation
      // This can happen if some users were deleted but memberships remain
      try {
        members = await prisma.communityMember.findMany({
          where: { communityId },
          orderBy: {
            joinedAt: 'asc',
          },
        })
        // Fetch users separately for valid memberships
        const userIds = members.map(m => m.userId).filter(Boolean)
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            createdAt: true,
          },
        })
        const userMap = new Map(users.map(u => [u.id, u]))
        members = members.map(m => ({
          ...m,
          user: userMap.get(m.userId) || null,
        }))
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        throw prismaError // Throw original error
      }
    }

    // Get user role for permission checks (super admin has all permissions)
    const effectiveRole = user?.isAdmin ? 'ADMIN' : await getUserCommunityRole(userId, communityId)
    const userRole = (effectiveRole || 'MEMBER') as CommunityRole

    // Filter out members with deleted users and map the rest
    const validMembers = members
      .filter(member => member.user !== null) // Filter out members with deleted users
      .map(member => ({
        id: member.id,
        role: member.role,
        memberClass: member.memberClass || 'household',
        joinedAt: member.joinedAt,
        user: member.user,
        canManage: user?.isAdmin || canManageCommunityRole(userRole, (member.role || 'MEMBER') as CommunityRole),
      }))

    return NextResponse.json({
      members: validMembers,
      assignableRoles: user?.isAdmin ? ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'] : getAssignableCommunityRoles(userRole),
    })
  } catch (error) {
    console.error('Error fetching community members:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', {
      errorMessage,
      error: error instanceof Error ? error.stack : String(error)
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch community members',
        details: errorMessage
      },
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Handle both Promise and direct params (Next.js 14 vs 15)
  const resolvedParams = params instanceof Promise ? await params : params
  const communityId = resolvedParams.id

  // Declare variables outside try block for error logging
  let targetUserId: string | undefined
  let targetUserEmail: string | undefined

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      console.error('[Add Community Member] Unauthorized - no session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    
    let body
    try {
      body = await request.json()
    } catch (err) {
      console.error('[Add Community Member] Invalid JSON in request body:', err)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    targetUserId = body.targetUserId
    targetUserEmail = body.targetUserEmail
    const role = body.role || 'MEMBER'
    const memberClass = body.memberClass || 'household'

    console.log('[Add Community Member] Request:', {
      userId,
      communityId,
      targetUserId,
      targetUserEmail,
      role,
      memberClass
    })
    
    // Validate required fields
    if (!targetUserId && !targetUserEmail) {
      return NextResponse.json({ error: 'Either targetUserId or targetUserEmail is required' }, { status: 400 })
    }
    
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID is required' }, { status: 400 })
    }

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

    // Validate UUID format for communityId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (communityId && !uuidRegex.test(communityId)) {
      return NextResponse.json({ 
        error: 'Invalid community ID format',
        details: 'Community ID must be a valid UUID'
      }, { status: 400 })
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
      // Validate UUID format for targetUserId
      if (!uuidRegex.test(targetUserId)) {
        return NextResponse.json({ 
          error: 'Invalid user ID format',
          details: 'User ID must be a valid UUID'
        }, { status: 400 })
      }
      
      targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      })
    } else if (targetUserEmail) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(targetUserEmail.trim())) {
        return NextResponse.json({ 
          error: 'Invalid email format',
          details: 'Please provide a valid email address'
        }, { status: 400 })
      }
      
      // Normalize email (trim and lowercase)
      const normalizedEmail = targetUserEmail.trim().toLowerCase()
      targetUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
      
      // If not found with normalized email, try original email
      if (!targetUser && normalizedEmail !== targetUserEmail) {
        targetUser = await prisma.user.findUnique({
          where: { email: targetUserEmail },
        })
      }
    }

    if (!targetUser) {
      const emailToSearch = targetUserEmail || targetUserId || 'unknown'
      return NextResponse.json({ 
        error: `User not found. The user with email "${emailToSearch}" must exist in the system before they can be added as a community member. Please create the user first in the Admin Users page.` 
      }, { status: 404 })
    }

    // Check if user is already a member
    let existingMembership
    try {
      existingMembership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: targetUser.id,
            communityId,
          },
        },
      })
    } catch (dbError: any) {
      console.error('[Add Community Member] Database error checking existing membership:', dbError)
      return NextResponse.json({ 
        error: 'Database error while checking membership',
        details: dbError.message || 'Failed to query database'
      }, { status: 500 })
    }

    if (existingMembership) {
      // Update existing membership instead of failing
      try {
        const updatedMembership = await prisma.communityMember.update({
          where: {
            userId_communityId: {
              userId: targetUser.id,
              communityId,
            },
          },
          data: {
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
        
        console.log('[Add Community Member] Updated existing membership:', {
          membershipId: updatedMembership.id,
          userId: targetUser.id,
          communityId,
          role
        })
        
        return NextResponse.json({
          id: updatedMembership.id,
          role: updatedMembership.role,
          joinedAt: updatedMembership.joinedAt,
          user: updatedMembership.user,
          message: 'Membership updated successfully'
        }, { status: 200 })
      } catch (updateError: any) {
        console.error('[Add Community Member] Error updating membership:', updateError)
        return NextResponse.json({ 
          error: 'User is already a member and failed to update',
          details: updateError.message || 'Unknown error'
        }, { status: 400 })
      }
    }

    // Create membership
    let membership
    try {
      membership = await prisma.communityMember.create({
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

    console.log('[Add Community Member] Success:', {
      membershipId: membership.id,
      userId: targetUser.id,
      communityId,
      role
    })

    return NextResponse.json({
      id: membership.id,
      role: membership.role,
      joinedAt: membership.joinedAt,
      user: membership.user,
    }, { status: 201 })
  } catch (error) {
    console.error('[Add Community Member] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('[Add Community Member] Error details:', {
      errorMessage,
      errorDetails,
      communityId,
      targetUserId,
      targetUserEmail
    })
    
    // Check if it's a database connection error
    if (errorMessage.includes('connect') || errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please check your database configuration.',
          details: 'Unable to connect to Supabase database. Please verify DATABASE_URL is correct in Vercel environment variables.'
        },
        { status: 503 }
      )
    }
    
    // Return more specific error messages
    if (errorMessage.includes('Unique constraint') || errorMessage.includes('P2002')) {
      return NextResponse.json(
        { error: 'User is already a member of this community' },
        { status: 400 }
      )
    }
    
    if (errorMessage.includes('Foreign key constraint') || errorMessage.includes('P2003')) {
      return NextResponse.json(
        { error: 'Invalid community or user ID. Please verify the IDs are correct.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to add community member',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

