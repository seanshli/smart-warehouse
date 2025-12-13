/**
 * Household-to-Household Chat API
 * Direct messaging between households
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastToHousehold } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

/**
 * GET /api/household/[id]/chat/[targetHouseholdId]/messages
 * Get messages between two households
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; targetHouseholdId: string }> | { id: string; targetHouseholdId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const householdId = resolvedParams.id
    const targetHouseholdId = resolvedParams.targetHouseholdId

    // Verify user is member of source household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this household' }, { status: 403 })
    }

    // Get or create conversation between households
    // For now, we'll use a simple message storage
    // In production, you might want a dedicated HouseholdChatMessage table
    
    // For simplicity, return empty for now - messages will be stored in a dedicated table
    // TODO: Implement household-to-household message storage
    
    return NextResponse.json({ messages: [] })
  } catch (error: any) {
    console.error('Error fetching household chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/household/[id]/chat/[targetHouseholdId]/messages
 * Send message to another household
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; targetHouseholdId: string }> | { id: string; targetHouseholdId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const householdId = resolvedParams.id
    const targetHouseholdId = resolvedParams.targetHouseholdId
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Verify user is member of source household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this household' }, { status: 403 })
    }

    const messageId = `msg-${Date.now()}`
    const messageData = {
      id: messageId,
      content: content.trim(),
      senderId: userId,
      senderName: membership.user.name || membership.user.email,
      createdAt: new Date().toISOString(),
    }

    // Record chat history for admin viewing (household-to-household)
    try {
      await prisma.chatHistory.create({
        data: {
          householdId,
          targetHouseholdId,
          senderId: userId,
          receiverType: 'household',
          receiverId: targetHouseholdId,
          content: content.trim(),
          messageType: 'text',
          format: 'text',
        },
      })
    } catch (historyError) {
      // Don't fail message creation if history recording fails
      console.error('Error recording chat history:', historyError)
    }

    // Broadcast message to target household via realtime
    broadcastToHousehold(targetHouseholdId, {
      type: 'message',
      targetHouseholdId,
      message: messageData,
    })

    // Also broadcast to source household (for confirmation)
    broadcastToHousehold(householdId, {
      type: 'message',
      targetHouseholdId,
      message: messageData,
    })

    return NextResponse.json({
      success: true,
      message: messageData,
    })
  } catch (error: any) {
    console.error('Error sending household chat message:', error)
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 }
    )
  }
}
