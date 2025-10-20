import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>()

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
        const connectionId = `${session.user.email}-${householdId}`
        connections.set(connectionId, controller)
        
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
            connections.delete(connectionId)
          }
        }, 30000)
        
        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(pingInterval)
          connections.delete(connectionId)
        })
      },
      
      cancel() {
        const connectionId = `${session.user.email}-${householdId}`
        connections.delete(connectionId)
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

// Function to broadcast updates to all connections in a household
export function broadcastToHousehold(householdId: string, data: any) {
  const message = JSON.stringify({
    type: 'update',
    data,
    timestamp: new Date().toISOString()
  })
  
  // Find all connections for this household
  for (const [connectionId, controller] of connections.entries()) {
    if (connectionId.endsWith(`-${householdId}`)) {
      try {
        controller.enqueue(`data: ${message}\n\n`)
      } catch (error) {
        console.error('Error sending update to connection:', error)
        connections.delete(connectionId)
      }
    }
  }
}

// Function to broadcast to specific user
export function broadcastToUser(userEmail: string, householdId: string, data: any) {
  const connectionId = `${userEmail}-${householdId}`
  const controller = connections.get(connectionId)
  
  if (controller) {
    const message = JSON.stringify({
      type: 'update',
      data,
      timestamp: new Date().toISOString()
    })
    
    try {
      controller.enqueue(`data: ${message}\n\n`)
    } catch (error) {
      console.error('Error sending update to user:', error)
      connections.delete(connectionId)
    }
  }
}
