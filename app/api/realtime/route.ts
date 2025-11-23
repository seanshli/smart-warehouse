import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addConnection, removeConnection } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        householdMemberships: {
          include: {
            household: true
          }
        }
      }
    })

    if (!user || !user.householdMemberships.length) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    const householdId = user.householdMemberships[0].household.id
    const connectionId = `${session.user.email}-${householdId}`

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Add connection
        addConnection(connectionId, controller)

        // Send initial connection message
        const encoder = new TextEncoder()
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)
        )

        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`)
            )
          } catch (error) {
            clearInterval(pingInterval)
            removeConnection(connectionId)
          }
        }, 30000)

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(pingInterval)
          removeConnection(connectionId)
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: any) {
    console.error('Error in realtime SSE:', error)
    return NextResponse.json(
      { error: 'Failed to establish realtime connection' },
      { status: 500 }
    )
  }
}
