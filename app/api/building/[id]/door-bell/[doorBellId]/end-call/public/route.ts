import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/door-bell/[doorBellId]/end-call/public
 * End a call session (public)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; doorBellId: string } }
) {
  try {
    const doorBellId = params.doorBellId

    const activeSession = await prisma.doorBellCallSession.findFirst({
      where: {
        doorBellId,
        status: {
          in: ['ringing', 'connected'],
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    })

    if (!activeSession) {
      return NextResponse.json({ success: true, message: 'No active session' })
    }

    await prisma.doorBellCallSession.update({
      where: { id: activeSession.id },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, message: 'Call ended' })
  } catch (error) {
    console.error('Error ending call:', error)
    return NextResponse.json(
      { error: 'Failed to end call' },
      { status: 500 }
    )
  }
}

