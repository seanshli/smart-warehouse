import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastDoorBellEvent } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/door-bell/[doorBellId]/message
 * Send a message during call (household member)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; doorBellId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const doorBellId = params.doorBellId
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Verify user is a member of the household
    const doorBell = await prisma.doorBell.findUnique({
      where: { id: doorBellId },
      include: {
        household: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!doorBell || !doorBell.household) {
      return NextResponse.json({ error: 'Door bell not found' }, { status: 404 })
    }

    if (doorBell.household.members.length === 0) {
      return NextResponse.json({ error: 'Not a member of this household' }, { status: 403 })
    }

    const activeSession = await prisma.doorBellCallSession.findFirst({
      where: {
        doorBellId,
        status: 'connected',
      },
      orderBy: {
        startedAt: 'desc',
      },
    })

    if (!activeSession) {
      return NextResponse.json(
        { error: 'No active call session' },
        { status: 400 }
      )
    }

    const newMessage = await prisma.doorBellMessage.create({
      data: {
        callSessionId: activeSession.id,
        from: 'household',
        message: message.trim(),
      },
    })

    // Broadcast message via realtime
    const doorBell = await prisma.doorBell.findUnique({
      where: { id: doorBellId },
      include: {
        building: { select: { id: true } },
        household: { select: { id: true } },
      },
    })

    if (doorBell?.building?.id && doorBell?.household?.id) {
      broadcastDoorBellEvent(doorBellId, doorBell.household.id, doorBell.building.id, {
        type: 'message',
        callSessionId: activeSession.id,
        message: {
          id: newMessage.id,
          text: newMessage.message,
          from: newMessage.from as 'guest' | 'household',
          timestamp: newMessage.createdAt,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        text: newMessage.message,
        from: newMessage.from as 'guest' | 'household',
        timestamp: newMessage.createdAt,
      },
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

