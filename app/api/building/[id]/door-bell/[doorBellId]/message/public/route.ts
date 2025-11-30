import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/door-bell/[doorBellId]/message/public
 * Send a message during call (public, for guests)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; doorBellId: string } }
) {
  try {
    const doorBellId = params.doorBellId
    const { message, from } = await request.json()

    if (!message || !from) {
      return NextResponse.json(
        { error: 'Message and from are required' },
        { status: 400 }
      )
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
        from: from === 'guest' ? 'guest' : 'household',
        message: message.trim(),
      },
    })

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

