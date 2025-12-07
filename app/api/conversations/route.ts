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

    // Build where clause
    const where: any = {
      OR: [
        { createdBy: userId }, // User created the conversation (frontdesk/admin)
      ],
    }

    // If householdId is provided, add it to OR condition and filter
    if (householdId) {
      where.OR.push({ householdId })
      where.householdId = householdId
    }

    // Add buildingId filter if provided
    if (buildingId) {
      where.buildingId = buildingId
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
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversations',
        details: error.message 
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
    return NextResponse.json(
      { 
        error: 'Failed to create conversation',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

