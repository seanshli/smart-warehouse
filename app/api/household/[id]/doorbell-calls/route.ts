import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/household/[id]/doorbell-calls
 * Get active doorbell calls for a household
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const householdId = params.id

    // Verify user is a member of the household
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

    // Get household's doorbells
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        doorBells: true,
      },
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Get active call sessions for this household's doorbells
    const doorBellIds = household.doorBells.map(db => db.id)
    
    const activeSessions = await prisma.doorBellCallSession.findMany({
      where: {
        doorBellId: {
          in: doorBellIds,
        },
        status: {
          in: ['ringing', 'connected'],
        },
      },
      include: {
        doorBell: {
          select: {
            id: true,
            doorBellNumber: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    })

    const calls = activeSessions.map(session => ({
      id: session.id,
      doorBellId: session.doorBellId,
      doorBellNumber: session.doorBell.doorBellNumber,
      status: session.status,
      startedAt: session.startedAt,
      messages: session.messages.map(msg => ({
        id: msg.id,
        text: msg.message,
        from: msg.from as 'guest' | 'household',
        timestamp: msg.createdAt,
      })),
    }))

    return NextResponse.json({ calls })
  } catch (error) {
    console.error('Error fetching doorbell calls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch doorbell calls' },
      { status: 500 }
    )
  }
}

