import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/door-bell/[doorBellId]/unlock
 * Unlock the front door (household member)
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
    const buildingId = params.id
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
        },
        building: true,
      },
    })

    if (!doorBell || !doorBell.household) {
      return NextResponse.json({ error: 'Door bell not found' }, { status: 404 })
    }

    if (doorBell.buildingId !== buildingId) {
      return NextResponse.json({ error: 'Door bell does not belong to this building' }, { status: 400 })
    }

    if (doorBell.household.members.length === 0) {
      return NextResponse.json({ error: 'Not a member of this household' }, { status: 403 })
    }

    // Verify there's an active call (ringing or connected)
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
      return NextResponse.json(
        { error: 'No active call session. Please ring the doorbell first.' },
        { status: 400 }
      )
    }

    // TODO: Integrate with actual door lock system (IoT device, smart lock, etc.)
    // For now, we'll just log the unlock action
    console.log(`[Door Unlock] Building: ${buildingId}, DoorBell: ${doorBellId}, User: ${userId}`)

    // Create unlock log entry (if model exists)
    try {
      await prisma.doorUnlockLog.create({
        data: {
          buildingId,
          doorBellId,
          unlockedBy: userId,
          unlockedAt: new Date(),
        },
      })
    } catch (error) {
      // Log unlock action even if model doesn't exist yet
      console.log(`[Door Unlock] Building: ${buildingId}, DoorBell: ${doorBellId}, User: ${userId}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Door unlocked',
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Error unlocking door:', error)
    return NextResponse.json(
      { error: 'Failed to unlock door' },
      { status: 500 }
    )
  }
}

