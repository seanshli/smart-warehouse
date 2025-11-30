import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/door-bell/[doorBellId]/call-status
 * Get current call status for a doorbell (public)
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
        status: {
          in: ['ringing', 'connected'],
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    })

    if (!activeSession) {
      return NextResponse.json({ status: 'ended' })
    }

    return NextResponse.json({
      status: activeSession.status,
      callSessionId: activeSession.id,
      startedAt: activeSession.startedAt,
      connectedAt: activeSession.connectedAt,
    })
  } catch (error) {
    console.error('Error fetching call status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch call status' },
      { status: 500 }
    )
  }
}

