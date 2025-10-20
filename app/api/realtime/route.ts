import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addConnection, removeConnection } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const url = new URL(request.url)
    const householdId = url.searchParams.get('householdId')
    
    if (!householdId) {
      return NextResponse.json({ error: 'Household ID required' }, { status: 400 })
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        // Store the connection
        const connectionId = `${session.user?.email}-${householdId}`
        addConnection(connectionId, controller)
        
        // Send initial connection message
        const data = JSON.stringify({
          type: 'connected',
          message: 'Real-time updates connected',
          timestamp: new Date().toISOString()
        })
        
        controller.enqueue(`data: ${data}\n\n`)
        
        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          try {
            const pingData = JSON.stringify({
              type: 'ping',
              timestamp: new Date().toISOString()
            })
            controller.enqueue(`data: ${pingData}\n\n`)
          } catch (error) {
            clearInterval(pingInterval)
            removeConnection(connectionId)
          }
        }, 30000)
        
        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(pingInterval)
          removeConnection(connectionId)
        })
      },
      
      cancel() {
        const connectionId = `${session.user?.email}-${householdId}`
        removeConnection(connectionId)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('SSE connection error:', error)
    return NextResponse.json(
      { error: 'Failed to establish real-time connection' },
      { status: 500 }
    )
  }
}

