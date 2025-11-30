import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/door-bell/[doorBellId]/answer
 * Answer a doorbell call (household member)
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
        },
      },
    })

    if (!doorBell || !doorBell.household) {
      return NextResponse.json({ error: 'Door bell not found' }, { status: 404 })
    }

    if (doorBell.household.members.length === 0) {
      return NextResponse.json({ error: 'Not a member of this household' }, { status: 403 })
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
    await prisma.doorBellCallSession.update({
      where: { id: activeSession.id },
      data: {
        status: 'connected',
        connectedAt: new Date(),
      },
    })

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

