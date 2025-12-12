/**
 * Household-to-Household Call API
 * Initiate video/audio call between households
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastToHousehold } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

/**
 * POST /api/household/[id]/chat/[targetHouseholdId]/call
 * Initiate a call to another household
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; targetHouseholdId: string }> | { id: string; targetHouseholdId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const householdId = resolvedParams.id
    const targetHouseholdId = resolvedParams.targetHouseholdId
    const body = await request.json()
    const { callType = 'audio', callId } = body

    if (!['audio', 'video'].includes(callType)) {
      return NextResponse.json(
        { error: 'callType must be "audio" or "video"' },
        { status: 400 }
      )
    }

    // Verify user is member of source household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        household: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this household' }, { status: 403 })
    }

    // Broadcast call to target household
    broadcastToHousehold(targetHouseholdId, {
      type: 'call',
      callType,
      callId: callId || `household-${householdId}-${targetHouseholdId}-${Date.now()}`,
      fromHouseholdId: householdId,
      fromHouseholdName: membership.household.name,
      fromUserId: userId,
      fromUserName: membership.user.name || membership.user.email,
      status: 'ringing',
    })

    return NextResponse.json({
      success: true,
      callId: callId || `household-${householdId}-${targetHouseholdId}-${Date.now()}`,
    })
  } catch (error: any) {
    console.error('Error initiating household call:', error)
    return NextResponse.json(
      { error: 'Failed to initiate call', details: error.message },
      { status: 500 }
    )
  }
}
