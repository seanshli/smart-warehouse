import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/members
 * Add a member to the building
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
    const buildingId = params.id
    const body = await request.json()
    const { targetUserId, targetUserEmail, role = 'MEMBER' } = body

    // Validate role
    const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check permissions
    // 1. Super admin can do anything
    // 2. Community ADMIN/MANAGER can add building members
    // 3. Building ADMIN/MANAGER can add building members
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, email: true, adminRole: true },
    })

    let hasPermission = false

    if (currentUser?.isAdmin) {
      hasPermission = true
    } else {
      // Get building to find community
      const building = await prisma.building.findUnique({
        where: { id: buildingId },
        select: { communityId: true },
      })

      if (building) {
        // Check if user is community admin/manager
        const communityMembership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: userId,
              communityId: building.communityId,
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
    }

    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to add building members',
        debug: {
          userId,
          email: currentUser?.email,
          isAdmin: currentUser?.isAdmin,
        }
      }, { status: 403 })
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
    const existingMembership = await prisma.buildingMember.findUnique({
      where: {
        userId_buildingId: {
          userId: targetUser.id,
          buildingId,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member of this building' }, { status: 400 })
    }

    // Get building info (we already have it from permission check, but get it again for memberClass)
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: { communityId: true },
    })

    // Determine memberClass: if user is a community admin/manager, set to 'community', otherwise 'household'
    let memberClass: 'household' | 'building' | 'community' = 'household'
    if (building) {
      const communityMembership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: targetUser.id,
            communityId: building.communityId,
          },
        },
      })
      if (communityMembership && (communityMembership.role === 'ADMIN' || communityMembership.role === 'MANAGER')) {
        memberClass = 'community'
      }
    }

    // Create membership
    const membership = await prisma.buildingMember.create({
      data: {
        userId: targetUser.id,
        buildingId,
        role: role as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER',
        memberClass,
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
    console.error('Error adding building member:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', {
      errorMessage,
      errorStack,
      buildingId,
      targetUserId,
      targetUserEmail,
      role,
    })
    return NextResponse.json(
      { 
        error: 'Failed to add building member',
        details: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          stack: errorStack,
          buildingId,
          targetUserId,
          role,
        } : undefined
      },
      { status: 500 }
    )
  }
}

