import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastDoorBellEvent } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/door-bell/[doorBellId]/end-call
 * End a call session (household member)
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
          select: {
            id: true,
            name: true,
            apartmentNo: true,
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

    // Broadcast call ended event in real-time
    try {
      broadcastDoorBellEvent(
        doorBell.id,
        doorBell.household?.id || null,
        doorBell.buildingId,
        {
          event: 'ended',
          callSessionId: activeSession.id,
          doorBellNumber: doorBell.doorBellNumber,
          household: doorBell.household ? {
            id: doorBell.household.id,
            name: doorBell.household.name,
            apartmentNo: doorBell.household.apartmentNo,
          } : null,
        }
      )
    } catch (broadcastError) {
      console.error('Error broadcasting doorbell end event:', broadcastError)
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({ success: true, message: 'Call ended' })
  } catch (error) {
    console.error('Error ending call:', error)
    return NextResponse.json(
      { error: 'Failed to end call' },
      { status: 500 }
    )
  }
}

