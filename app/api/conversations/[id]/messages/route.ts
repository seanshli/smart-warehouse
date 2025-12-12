import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastToHousehold, broadcastToUser } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conversations/[id]/messages
 * Get messages for a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const conversationId = resolvedParams.id

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        householdId: true,
        createdBy: true,
        household: {
          select: {
            members: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check access: user is creator or household member
    const hasAccess = 
      conversation.createdBy === userId ||
      conversation.household.members.length > 0 ||
      (session.user as any).isAdmin

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({ success: true, messages })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch messages',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations/[id]/messages
 * Send a message in a conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const conversationId = resolvedParams.id
    const body = await request.json()
    const { content, messageType = 'text', metadata } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        householdId: true,
        createdBy: true,
        household: {
          select: {
            members: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check access: user is creator or household member
    const hasAccess = 
      conversation.createdBy === userId ||
      conversation.household.members.length > 0 ||
      (session.user as any).isAdmin

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content.trim(),
        messageType,
        metadata: metadata || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Broadcast to household members
    broadcastToHousehold(conversation.householdId, {
      type: 'message',
      conversationId,
      message,
    })

    // Also notify conversation creator (front desk/admin) if different from sender
    if (conversation.createdBy !== userId) {
      const creator = await prisma.user.findUnique({
        where: { id: conversation.createdBy },
        select: { email: true },
      }).catch(() => null)

      if (creator) {
        broadcastToUser(creator.email, conversation.householdId, {
          type: 'message',
          conversationId,
          message,
        })
      }
    }

    return NextResponse.json({ success: true, message })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

