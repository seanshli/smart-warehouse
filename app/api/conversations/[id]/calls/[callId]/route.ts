import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastToHousehold } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/conversations/[id]/calls/[callId]
 * Answer, reject, or end a call
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; callId: string }> | { id: string; callId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const conversationId = resolvedParams.id
    const callId = resolvedParams.callId
    const body = await request.json()
    const { action } = body // 'answer' | 'reject' | 'end'

    if (!['answer', 'reject', 'end'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "answer", "reject", or "end"' },
        { status: 400 }
      )
    }

    // Get call session
    const callSession = await prisma.callSession.findUnique({
      where: { id: callId },
      include: {
        conversation: {
          select: {
            id: true,
            householdId: true,
            createdBy: true,
            household: {
              select: {
                members: {
                  where: { userId },
                  select: { id: true },
                },
              },
            },
          },
        },
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!callSession) {
      return NextResponse.json({ error: 'Call session not found' }, { status: 404 })
    }

    if (callSession.conversationId !== conversationId) {
      return NextResponse.json({ error: 'Call does not belong to this conversation' }, { status: 400 })
    }

    // Verify user has access
    const hasAccess = 
      callSession.conversation.createdBy === userId ||
      callSession.conversation.household.members.length > 0 ||
      (session.user as any).isAdmin

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    let updatedCallSession

    if (action === 'answer') {
      if (callSession.status !== 'ringing') {
        return NextResponse.json(
          { error: 'Call is not in ringing state' },
          { status: 400 }
        )
      }

      updatedCallSession = await prisma.callSession.update({
        where: { id: callId },
        data: {
          status: 'answered',
          answeredAt: new Date(),
        },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Broadcast answer
      broadcastToHousehold(callSession.conversation.householdId, {
        type: 'call',
        callSessionId: callId,
        status: 'answered',
      })
    } else if (action === 'reject') {
      if (callSession.status !== 'ringing') {
        return NextResponse.json(
          { error: 'Call is not in ringing state' },
          { status: 400 }
        )
      }

      updatedCallSession = await prisma.callSession.update({
        where: { id: callId },
        data: {
          status: 'rejected',
          endedAt: new Date(),
        },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Broadcast rejection
      broadcastToHousehold(callSession.conversation.householdId, {
        type: 'call',
        callSessionId: callId,
        status: 'rejected',
      })
    } else if (action === 'end') {
      if (callSession.status !== 'answered' && callSession.status !== 'ringing') {
        return NextResponse.json(
          { error: 'Call is not active' },
          { status: 400 }
        )
      }

      const startedAt = callSession.startedAt || new Date()
      const endedAt = new Date()
      const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)

      updatedCallSession = await prisma.callSession.update({
        where: { id: callId },
        data: {
          status: 'ended',
          endedAt,
          duration,
        },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Broadcast end
      broadcastToHousehold(callSession.conversation.householdId, {
        type: 'call',
        callSessionId: callId,
        status: 'ended',
        duration,
      })
    }

    return NextResponse.json({ success: true, callSession: updatedCallSession })
  } catch (error: any) {
    console.error('Error updating call:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update call',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

