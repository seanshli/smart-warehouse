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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Handle both Promise and direct params (Next.js 14 vs 15)
  const resolvedParams = params instanceof Promise ? await params : params
  const buildingId = resolvedParams.id

  // Declare variables outside try block for error logging
  let targetUserId: string | undefined
  let targetUserEmail: string | undefined

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      console.error('[Add Building Member] Unauthorized - no session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    targetUserId = body.targetUserId
    targetUserEmail = body.targetUserEmail
    const role: string = body.role || 'MEMBER'
    const memberClass: 'household' | 'building' | 'community' | undefined = body.memberClass // Allow explicit memberClass from request

    console.log('[Add Building Member] Request:', {
      userId,
      buildingId,
      targetUserId,
      targetUserEmail,
      role,
      memberClass
    })

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

    // Validate UUID format for buildingId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(buildingId)) {
      return NextResponse.json({ 
        error: 'Invalid building ID format',
        details: 'Building ID must be a valid UUID'
      }, { status: 400 })
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
      
      targetUser = await prisma.user.findUnique({
        where: { email: targetUserEmail.trim().toLowerCase() },
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

      // Determine memberClass: use provided value, or if user is a community admin/manager, set to 'community', otherwise 'household'
      let finalMemberClass: 'household' | 'building' | 'community' = memberClass || 'household'
      if (!memberClass && building) {
        const communityMembership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: targetUser.id,
              communityId: building.communityId,
            },
          },
        })
        if (communityMembership && (communityMembership.role === 'ADMIN' || communityMembership.role === 'MANAGER')) {
          finalMemberClass = 'community'
        }
      } else if (memberClass) {
        finalMemberClass = memberClass
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
          memberClass: finalMemberClass,
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

      // If user is now a building ADMIN, ensure they have community membership
      if (role === 'ADMIN' && building) {
        const communityMembership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: targetUser.id,
              communityId: building.communityId,
            },
          },
        })

        if (!communityMembership) {
          // Building admin should be a community member - create membership if missing
          try {
            await prisma.communityMember.create({
              data: {
                userId: targetUser.id,
                communityId: building.communityId,
                role: 'MEMBER',
                memberClass: 'building',
              },
            })
            console.log('[Add Building Member] Created community membership for building admin:', {
              userId: targetUser.id,
              communityId: building.communityId,
            })
          } catch (createError: any) {
            // If creation fails (e.g., unique constraint), try to update instead
            console.error('[Add Building Member] Error creating community membership:', createError)
            if (createError.code === 'P2002') {
              // Membership already exists, update it
              await prisma.communityMember.update({
                where: {
                  userId_communityId: {
                    userId: targetUser.id,
                    communityId: building.communityId,
                  },
                },
                data: {
                  role: 'MEMBER',
                  memberClass: 'building',
                },
              })
            }
          }
        } else {
          // If user has community role MANAGER or higher but is building admin, downgrade to MEMBER
          if (communityMembership.role !== 'ADMIN' && communityMembership.role !== 'MEMBER') {
            await prisma.communityMember.update({
              where: {
                userId_communityId: {
                  userId: targetUser.id,
                  communityId: building.communityId,
                },
              },
              data: {
                role: 'MEMBER',
                memberClass: 'building',
              },
            })
          } else if (communityMembership.memberClass !== 'building') {
            // Update memberClass to 'building' if it's different
            await prisma.communityMember.update({
              where: {
                userId_communityId: {
                  userId: targetUser.id,
                  communityId: building.communityId,
                },
              },
              data: {
                memberClass: 'building',
              },
            })
          }
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

    // Determine memberClass: use provided value, or if user is a community admin/manager, set to 'community', otherwise 'household'
    let finalMemberClass: 'household' | 'building' | 'community' = memberClass || 'household'
    if (!memberClass && building) {
      const communityMembership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: targetUser.id,
            communityId: building.communityId,
          },
        },
      })
      if (communityMembership && (communityMembership.role === 'ADMIN' || communityMembership.role === 'MANAGER')) {
        finalMemberClass = 'community'
      }
    } else if (memberClass) {
      finalMemberClass = memberClass
    }

    // Create membership - try with memberClass first, fallback without it if column doesn't exist
    let membership
    try {
      membership = await prisma.buildingMember.create({
        data: {
          userId: targetUser.id,
          buildingId,
          role: role as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER',
          memberClass: finalMemberClass,
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

    // If user is a building member with memberClass='building' (working team) or ADMIN role, ensure they have community membership
    if (building && (role === 'ADMIN' || finalMemberClass === 'building')) {
      const communityMembership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: targetUser.id,
            communityId: building.communityId,
          },
        },
      })

      if (!communityMembership) {
        // Building admin should be a community member - create membership if missing
        try {
          // Try with memberClass first, fallback without it if column doesn't exist
          try {
            await prisma.communityMember.create({
              data: {
                userId: targetUser.id,
                communityId: building.communityId,
                role: 'MEMBER',
                memberClass: 'building',
              },
            })
          } catch (memberClassError: any) {
            // If memberClass column doesn't exist, create without it
            if (memberClassError.message?.includes('member_class') || memberClassError.code === 'P2022') {
              await prisma.communityMember.create({
                data: {
                  userId: targetUser.id,
                  communityId: building.communityId,
                  role: 'MEMBER',
                },
              })
            } else {
              throw memberClassError
            }
          }
          console.log('[Add Building Member] Created community membership for building admin:', {
            userId: targetUser.id,
            communityId: building.communityId,
          })
        } catch (createError: any) {
          // If creation fails (e.g., unique constraint), try to update instead
          console.error('[Add Building Member] Error creating community membership:', createError)
          if (createError.code === 'P2002') {
            // Membership already exists, update it
            await prisma.communityMember.update({
              where: {
                userId_communityId: {
                  userId: targetUser.id,
                  communityId: building.communityId,
                },
              },
              data: {
                role: 'MEMBER',
                memberClass: 'building',
              },
            })
          }
        }
      } else {
        // If user has community role MANAGER or higher but is building admin, downgrade to MEMBER
        if (communityMembership.role !== 'ADMIN' && communityMembership.role !== 'MEMBER') {
          await prisma.communityMember.update({
            where: {
              userId_communityId: {
                userId: targetUser.id,
                communityId: building.communityId,
              },
            },
            data: {
              role: 'MEMBER',
              memberClass: 'building',
            },
          })
        } else if (communityMembership.memberClass !== 'building') {
          // Update memberClass to 'building' if it's different
          await prisma.communityMember.update({
            where: {
              userId_communityId: {
                userId: targetUser.id,
                communityId: building.communityId,
              },
            },
            data: {
              memberClass: 'building',
            },
          })
        }
      }
    }

    console.log('[Add Building Member] Success:', {
      membershipId: membership.id,
      userId: targetUser.id,
      buildingId,
      role
    })

    return NextResponse.json({
      id: membership.id,
      role: membership.role,
      joinedAt: membership.joinedAt,
      user: membership.user,
    }, { status: 201 })
  } catch (error) {
    console.error('[Add Building Member] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('[Add Building Member] Error details:', {
      errorMessage,
      errorDetails,
      buildingId,
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
        { error: 'User is already a member of this building' },
        { status: 400 }
      )
    }
    
    if (errorMessage.includes('Foreign key constraint') || errorMessage.includes('P2003')) {
      return NextResponse.json(
        { error: 'Invalid building or user ID. Please verify the IDs are correct.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to add building member',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

