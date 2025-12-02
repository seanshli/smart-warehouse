import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { broadcastDoorBellEvent } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/door-bell/[doorBellId]/answer/public
 * Answer a doorbell call (public - for front desk)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; doorBellId: string } }
) {
  try {
    const buildingId = params.id
    const doorBellId = params.doorBellId

    // Verify doorbell belongs to this building
    const doorBell = await prisma.doorBell.findUnique({
      where: { id: doorBellId },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true,
          },
        },
      },
    })

    if (!doorBell) {
      return NextResponse.json({ error: 'Door bell not found' }, { status: 404 })
    }

    if (doorBell.buildingId !== buildingId) {
      return NextResponse.json({ error: 'Door bell does not belong to this building' }, { status: 400 })
    }

    // Find active call session
    const activeSession = await prisma.doorBellCallSession.findFirst({
      where: {
        doorBellId,
        status: 'ringing',
      },
      orderBy: {
        startedAt: 'desc',
      },
    })

    if (!activeSession) {
      return NextResponse.json(
        { error: 'No active call to answer' },
        { status: 400 }
      )
    }

    // Update session to connected
    const updatedSession = await prisma.doorBellCallSession.update({
      where: { id: activeSession.id },
      data: {
        status: 'connected',
        connectedAt: new Date(),
      },
    })

    // Broadcast call answered event in real-time
    try {
      broadcastDoorBellEvent(
        doorBell.id,
        doorBell.household?.id || null,
        buildingId,
        {
          event: 'answered',
          callSessionId: updatedSession.id,
          doorBellNumber: doorBell.doorBellNumber,
          household: doorBell.household ? {
            id: doorBell.household.id,
            name: doorBell.household.name,
            apartmentNo: doorBell.household.apartmentNo,
          } : null,
        }
      )
    } catch (broadcastError) {
      console.error('Error broadcasting doorbell answer event:', broadcastError)
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({
      success: true,
      message: 'Call answered',
      callSessionId: activeSession.id,
    })
  } catch (error) {
    console.error('Error answering call:', error)
    return NextResponse.json(
      { error: 'Failed to answer call' },
      { status: 500 }
    )
  }
}

