/**
 * WebRTC Signaling Server API
 * Handles WebRTC signaling (offer/answer/ICE candidates) for video/audio calls
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastToHousehold, broadcastToBuilding, broadcastToUser } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

// Store pending signaling messages (offer/answer/ICE candidates)
// Format: { callId: { fromUserId: { type: 'offer'|'answer'|'ice-candidate', data: {...} } } }
const signalingMessages = new Map<string, Map<string, Array<{
  type: 'offer' | 'answer' | 'ice-candidate'
  data: any
  timestamp: Date
}>>>()

/**
 * POST /api/webrtc/signaling
 * Send WebRTC signaling message (offer, answer, or ICE candidate)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { 
      callId,           // Call session ID or doorbell call ID
      callType,         // 'conversation' | 'doorbell'
      targetUserId,     // User ID to send signaling to (optional, for direct messages)
      targetHouseholdId, // Household ID to broadcast to (optional)
      targetBuildingId, // Building ID to broadcast to (optional)
      type,             // 'offer' | 'answer' | 'ice-candidate'
      data              // Signaling data (SDP offer/answer or ICE candidate)
    } = body

    if (!callId || !type || !data) {
      return NextResponse.json(
        { error: 'callId, type, and data are required' },
        { status: 400 }
      )
    }

    if (!['offer', 'answer', 'ice-candidate'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be "offer", "answer", or "ice-candidate"' },
        { status: 400 }
      )
    }

    // Store signaling message
    if (!signalingMessages.has(callId)) {
      signalingMessages.set(callId, new Map())
    }
    const callSignaling = signalingMessages.get(callId)!
    
    if (!callSignaling.has(userId)) {
      callSignaling.set(userId, [])
    }
    callSignaling.get(userId)!.push({
      type: type as 'offer' | 'answer' | 'ice-candidate',
      data,
      timestamp: new Date(),
    })

    // Broadcast signaling message based on call type
    if (callType === 'conversation') {
      // Get conversation to find household
      const callSession = await prisma.callSession.findUnique({
        where: { id: callId },
        include: {
          conversation: {
            select: {
              householdId: true,
              createdBy: true,
            },
          },
        },
      }).catch(() => null)

      if (callSession) {
        // Broadcast to household members
        if (!callSession.conversation) {
          return NextResponse.json({ error: 'Call session missing conversation data' }, { status: 400 })
        }
        broadcastToHousehold(callSession.conversation.householdId, {
          type: 'webrtc-signaling',
          callId,
          callType: 'conversation',
          fromUserId: userId,
          signalingType: type,
          data,
        })

        // Also send to conversation creator (front desk/admin)
        if (callSession.conversation && callSession.conversation.createdBy !== userId) {
          const creator = await prisma.user.findUnique({
            where: { id: callSession.conversation.createdBy },
            select: { email: true },
          }).catch(() => null)

          if (creator) {
            broadcastToUser(creator.email, callSession.conversation.householdId, {
              type: 'webrtc-signaling',
              callId,
              callType: 'conversation',
              fromUserId: userId,
              signalingType: type,
              data,
            })
          }
        }
      }
    } else if (callType === 'doorbell') {
      // Get doorbell call session
      const doorbellCall = await prisma.doorBellCallSession.findUnique({
        where: { id: callId },
        include: {
          doorBell: {
            include: {
              building: {
                select: { id: true },
              },
              household: {
                select: { id: true },
              },
            },
          },
        },
      }).catch(() => null)

      if (doorbellCall) {
        const buildingId = doorbellCall.doorBell.building?.id
        const householdId = doorbellCall.doorBell.household?.id

        // Broadcast to building (front desk)
        if (buildingId) {
          broadcastToBuilding(buildingId, {
            type: 'webrtc-signaling',
            callId,
            callType: 'doorbell',
            fromUserId: userId,
            signalingType: type,
            data,
          })
        }

        // Broadcast to household (resident)
        if (householdId) {
          broadcastToHousehold(householdId, {
            type: 'webrtc-signaling',
            callId,
            callType: 'doorbell',
            fromUserId: userId,
            signalingType: type,
            data,
          })
        }
      }
    } else if (targetHouseholdId) {
      // Direct household broadcast
      broadcastToHousehold(targetHouseholdId, {
        type: 'webrtc-signaling',
        callId,
        callType: 'household',
        fromUserId: userId,
        signalingType: type,
        data,
      })
    } else if (targetBuildingId) {
      // Direct building broadcast
      broadcastToBuilding(targetBuildingId, {
        type: 'webrtc-signaling',
        callId,
        callType: 'building',
        fromUserId: userId,
        signalingType: type,
        data,
      })
    } else if (targetUserId) {
      // Direct user message (for household-to-household)
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { email: true },
      }).catch(() => null)

      if (targetUser && targetHouseholdId) {
        broadcastToUser(targetUser.email, targetHouseholdId, {
          type: 'webrtc-signaling',
          callId,
          callType: 'direct',
          fromUserId: userId,
          signalingType: type,
          data,
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Signaling message sent',
    })
  } catch (error: any) {
    console.error('Error handling WebRTC signaling:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send signaling message',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webrtc/signaling
 * Get pending signaling messages for a call
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const url = new URL(request.url)
    const callId = url.searchParams.get('callId')

    if (!callId) {
      return NextResponse.json(
        { error: 'callId is required' },
        { status: 400 }
      )
    }

    // Get all signaling messages for this call (excluding own messages)
    const callSignaling = signalingMessages.get(callId)
    if (!callSignaling) {
      return NextResponse.json({ messages: [] })
    }

    const messages: Array<{
      fromUserId: string
      type: string
      data: any
      timestamp: string
    }> = []

    callSignaling.forEach((userMessages, fromUserId) => {
      if (fromUserId !== userId) {
        userMessages.forEach(msg => {
          messages.push({
            fromUserId,
            type: msg.type,
            data: msg.data,
            timestamp: msg.timestamp.toISOString(),
          })
        })
      }
    })

    // Clear old messages (older than 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60000)
    callSignaling.forEach((userMessages, fromUserId) => {
      const filtered = userMessages.filter(msg => msg.timestamp > oneMinuteAgo)
      if (filtered.length === 0) {
        callSignaling.delete(fromUserId)
      } else {
        callSignaling.set(fromUserId, filtered)
      }
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Error fetching signaling messages:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch signaling messages',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/webrtc/signaling
 * Clear signaling messages for a call
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const callId = url.searchParams.get('callId')

    if (callId) {
      signalingMessages.delete(callId)
      return NextResponse.json({ success: true, message: 'Signaling messages cleared' })
    }

    return NextResponse.json({ error: 'callId is required' }, { status: 400 })
  } catch (error: any) {
    console.error('Error clearing signaling messages:', error)
    return NextResponse.json(
      { 
        error: 'Failed to clear signaling messages',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
