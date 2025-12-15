import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateConversation } from '@/lib/messaging/permissions'

// POST /api/maintenance/front-desk-chat - Request chat with front desk
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { householdId, buildingId, initialMessage, ticketId } = body

    if (!householdId) {
      return NextResponse.json({ error: 'householdId is required' }, { status: 400 })
    }

    // Verify user belongs to household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get building if not provided
    let effectiveBuildingId = buildingId
    if (!effectiveBuildingId) {
      const household = await prisma.household.findUnique({
        where: { id: householdId },
        select: { buildingId: true }
      })
      effectiveBuildingId = household?.buildingId || null
    }

    // Create or get conversation with front desk
    const conversationId = await getOrCreateConversation(
      userId,
      householdId,
      effectiveBuildingId,
      ticketId ? 'maintenance_ticket' : 'front_desk',
      ticketId || null
    )

    // If initial message provided, send it
    if (initialMessage) {
      await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: initialMessage,
          messageType: 'text'
        }
      })

      // Record in chat history
      await prisma.chatHistory.create({
        data: {
          conversationId,
          senderId: userId,
          receiverId: null, // Front desk (will be determined by conversation creator)
          receiverType: 'frontdesk',
          messageType: 'text',
          content: initialMessage
        }
      })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true
          }
        },
        building: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    return NextResponse.json({ conversation })
  } catch (error: any) {
    console.error('Error creating front desk chat:', error)
    return NextResponse.json(
      { error: 'Failed to create chat', details: error.message },
      { status: 500 }
    )
  }
}
