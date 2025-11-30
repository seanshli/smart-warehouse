import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/door-bell/[doorBellId]/messages
 * Get messages for active call (public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; doorBellId: string } }
) {
  try {
    const doorBellId = params.doorBellId

    const activeSession = await prisma.doorBellCallSession.findFirst({
      where: {
        doorBellId,
        status: 'connected',
      },
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!activeSession) {
      return NextResponse.json({ messages: [] })
    }

    const messages = activeSession.messages.map(msg => ({
      id: msg.id,
      text: msg.message,
      from: msg.from as 'guest' | 'household',
      timestamp: msg.createdAt,
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

