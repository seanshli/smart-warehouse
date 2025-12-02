import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addConnection, removeConnection } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/realtime
 * Building-level realtime connection (for front desk)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buildingId = params.id

    // Verify user has access to this building
    const userId = (session.user as any)?.id
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        members: {
          where: { userId },
        },
        community: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    // Check access (building member, community member, or admin)
    const hasAccess = building.members.length > 0 || 
                     building.community.members.length > 0 ||
                     (session.user as any).isAdmin

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const connectionId = `${session.user.email}-${buildingId}-building`

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
    console.error('Error in building realtime SSE:', error)
    return NextResponse.json(
      { error: 'Failed to establish realtime connection' },
      { status: 500 }
    )
  }
}

