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
  const buildingId = params.id
  let targetUserId: string | undefined
  let targetUserEmail: string | undefined
  let role: string = 'MEMBER'

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    targetUserId = body.targetUserId
    targetUserEmail = body.targetUserEmail
    role = body.role || 'MEMBER'

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
      // Get building info for memberClass determination
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

      // If already a member, update the role instead of creating new
      const updatedMembership = await prisma.buildingMember.update({
        where: {
          userId_buildingId: {
            userId: targetUser.id,
            buildingId,
          },
        },
        data: {
          role: role as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER',
          memberClass: memberClass,
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

      // If user is now a building ADMIN, ensure their community role is MEMBER (not MANAGER or higher)
      if (role === 'ADMIN' && building) {
        const communityMembership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: targetUser.id,
              communityId: building.communityId,
            },
          },
        })

        // If user has community role MANAGER or higher but is building admin, downgrade to MEMBER
        if (communityMembership && communityMembership.role !== 'ADMIN' && communityMembership.role !== 'MEMBER') {
          await prisma.communityMember.update({
            where: {
              userId_communityId: {
                userId: targetUser.id,
                communityId: building.communityId,
              },
            },
            data: {
              role: 'MEMBER',
            },
          })
        }
      }

      return NextResponse.json({
        id: updatedMembership.id,
        role: updatedMembership.role,
        joinedAt: updatedMembership.joinedAt,
        user: updatedMembership.user,
      }, { status: 200 })
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
          buildingId: buildingId || 'unknown',
          targetUserId: targetUserId || 'unknown',
          targetUserEmail: targetUserEmail || 'unknown',
          role: role || 'unknown',
        } : undefined
      },
      { status: 500 }
    )
  }
}

