import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastToHousehold, broadcastToUser } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

/**
 * POST /api/conversations/[id]/calls
 * Initiate a video/audio call
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const conversationId = resolvedParams.id
    const body = await request.json()
    const { callType = 'audio' } = body

    if (callType !== 'audio' && callType !== 'video') {
      return NextResponse.json(
        { error: 'callType must be "audio" or "video"' },
        { status: 400 }
      )
    }

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check access: user is creator or household member
    const hasAccess = 
      conversation.createdBy === userId ||
      conversation.household.members.length > 0 ||
      (session.user as any).isAdmin

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if there's an active call
    const activeCall = await prisma.callSession.findFirst({
      where: {
        conversationId,
        status: {
          in: ['ringing', 'answered'],
        },
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

    if (activeCall) {
      // Automatically create rejected call session
      const rejectionReason = `Call already active. Existing call initiated by ${activeCall.initiator.name || activeCall.initiator.email}`
      const rejectedCall = await prisma.callSession.create({
        data: {
          conversationId,
          initiatorId: userId,
          callType,
          status: 'auto-rejected',
          rejectionReason,
          startedAt: new Date(),
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

      return NextResponse.json(
        {
          success: false,
          error: 'There is already an active call in this conversation',
          errorCode: 'CALL_OCCUPIED',
          callSession: rejectedCall,
          conflict: {
            activeCallId: activeCall.id,
            activeCallInitiator: activeCall.initiator.name || activeCall.initiator.email,
            activeCallType: activeCall.callType,
            activeCallStartedAt: activeCall.startedAt,
          },
        },
        { status: 409 } // 409 Conflict
      )
    }

    // Create call session
    const callSession = await prisma.callSession.create({
      data: {
        conversationId,
        initiatorId: userId,
        callType,
        status: 'ringing',
        startedAt: new Date(),
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        conversation: {
          select: {
            householdId: true,
          },
        },
      },
    })

    // Broadcast call to household members
    broadcastToHousehold(conversation.householdId, {
      type: 'call',
      callType,
      conversationId,
      callSessionId: callSession.id,
      initiator: callSession.initiator,
      status: 'ringing',
    })

    // Also notify conversation creator (front desk/admin) if different from initiator
    if (conversation.createdBy !== userId) {
      const creator = await prisma.user.findUnique({
        where: { id: conversation.createdBy },
        select: { email: true },
      }).catch(() => null)

      if (creator) {
        broadcastToUser(creator.email, conversation.householdId, {
          type: 'call',
          callType,
          conversationId,
          callSessionId: callSession.id,
          initiator: callSession.initiator,
          status: 'ringing',
        })
      }
    }

    return NextResponse.json({ success: true, callSession })
  } catch (error: any) {
    console.error('Error initiating call:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initiate call',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/conversations/[id]/calls
 * Get call history for a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const conversationId = resolvedParams.id

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check access
    const hasAccess = 
      conversation.createdBy === userId ||
      conversation.household.members.length > 0 ||
      (session.user as any).isAdmin

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get call history
    const calls = await prisma.callSession.findMany({
      where: { conversationId },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, calls })
  } catch (error: any) {
    console.error('Error fetching calls:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch calls',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

