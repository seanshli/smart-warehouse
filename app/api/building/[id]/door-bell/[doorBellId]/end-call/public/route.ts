import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/door-bell/[doorBellId]/end-call/public
 * End a call session (public)
 */
export async function POST(
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
      return NextResponse.json({ success: true, message: 'No active session' })
    }

    try {
      await prisma.doorBellCallSession.update({
        where: { id: activeSession.id },
        data: {
          status: 'ended',
          endedAt: new Date(),
        },
      })
    } catch (updateError: any) {
      console.error('Error updating call session:', updateError)
      // If session was already deleted or doesn't exist, that's okay
      if (updateError.code === 'P2025') {
        return NextResponse.json({ success: true, message: 'Session already ended' })
      }
      throw updateError
    }

    return NextResponse.json({ success: true, message: 'Call ended' })
  } catch (error: any) {
    console.error('Error ending call:', error)
    console.error('Error details:', {
      code: error?.code,
      meta: error?.meta,
      message: error?.message,
    })
    
    // Provide more specific error messages
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { success: true, message: 'Session not found or already ended' }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to end call',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

