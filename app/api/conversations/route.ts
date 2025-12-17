import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canMessageHousehold, getOrCreateConversation } from '@/lib/messaging/permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conversations
 * Get all conversations for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const buildingId = searchParams.get('buildingId')
    const communityId = searchParams.get('communityId')

    // Build where clause
    // User can see conversations they created (as frontdesk/admin) OR conversations for their household
    const whereConditions: any[] = [
      { createdBy: userId }, // User created the conversation (frontdesk/admin)
    ]

    // If householdId is provided, check if user is a member
    if (householdId) {
      const membership = await prisma.householdMember.findUnique({
        where: {
          userId_householdId: {
            userId,
            householdId
          }
        }
      })
      
      if (membership) {
        // User is household member, can see conversations for this household
        whereConditions.push({ householdId })
      }
    } else {
      // No householdId provided, get all user's households
      const userHouseholds = await prisma.householdMember.findMany({
        where: { userId },
        select: { householdId: true }
      })
      
      if (userHouseholds.length > 0) {
        // Add all user's households to OR condition
        whereConditions.push({
          householdId: { in: userHouseholds.map(h => h.householdId) }
        })
      }
    }

    // Build final where clause
    const where: any = {
      OR: whereConditions
    }

    // Add buildingId filter if provided (applies to all conditions)
    if (buildingId) {
      where.buildingId = buildingId
    }
    
    // Add communityId filter if provided (for community-level conversations)
    if (communityId) {
      // For community level, we need to get all buildings in the community
      const buildings = await prisma.building.findMany({
        where: { communityId },
        select: { id: true }
      })
      const buildingIds = buildings.map(b => b.id)
      if (buildingIds.length > 0) {
        where.buildingId = { in: buildingIds }
      } else {
        // No buildings in community, return empty
        return NextResponse.json({ success: true, conversations: [] })
      }
    }
    
    // If householdId was provided, also filter by it directly
    if (householdId) {
      where.householdId = householdId
    }

    // Auto-create conversations for active households if user is admin and buildingId/communityId is provided
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    if (user?.isAdmin && (buildingId || communityId)) {
      try {
        // Call the SQL function to ensure conversations exist
        if (buildingId) {
          await prisma.$executeRawUnsafe(
            `SELECT ensure_household_conversations($1, $2)`,
            userId,
            buildingId
          )
        } else if (communityId) {
          await prisma.$executeRawUnsafe(
            `SELECT ensure_household_conversations($1, NULL, $2)`,
            userId,
            communityId
          )
        }
      } catch (error) {
        // If function doesn't exist yet, log but don't fail
        console.warn('ensure_household_conversations function not found, skipping auto-create:', error)
      }
    }

    // Get conversations where user is creator (frontdesk/admin) or household member
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true,
            _count: {
              select: {
                members: true
              }
            }
          },
        },
        ...(buildingId ? {
          building: {
            select: {
              id: true,
              name: true,
            },
          },
        } : {}),
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                readAt: null,
                senderId: { not: userId }, // Unread messages not sent by current user
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, conversations })
  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversations',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorDetails })
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { householdId, buildingId, type = 'general', relatedId } = body

    if (!householdId) {
      return NextResponse.json(
        { error: 'householdId is required' },
        { status: 400 }
      )
    }

    // Check permission
    if (!(await canMessageHousehold(userId, householdId))) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create conversation' },
        { status: 403 }
      )
    }

    // Get or create conversation
    const conversationId = await getOrCreateConversation(
      userId,
      householdId,
      buildingId || null,
      type,
      relatedId || null
    )

    // Fetch full conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true,
          },
        },
        building: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, conversation })
  } catch (error: any) {
    console.error('Error creating conversation:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        error: 'Failed to create conversation',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorDetails })
      },
      { status: 500 }
    )
  }
}

