import { NextRequest } from 'next/server'
import WebSocket from 'ws'

export const runtime = 'nodejs'

const BASE_URL = process.env.HOME_ASSISTANT_BASE_URL
const ACCESS_TOKEN = process.env.HOME_ASSISTANT_ACCESS_TOKEN

export async function GET(request: NextRequest) {
  if (!BASE_URL || !ACCESS_TOKEN) {
    return new Response('Home Assistant credentials not configured', {
      status: 500,
    })
  }

  const searchParams = request.nextUrl.searchParams
  const entitiesParam = searchParams.get('entities')
  const entitySet = new Set(
    entitiesParam
      ? entitiesParam
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : []
  )

  const wsUrl = BASE_URL.replace(/^http/i, 'ws') + '/api/websocket'

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      let authenticated = false
      let subscriptionId = 1

      const websocket = new WebSocket(wsUrl)

      const closeStream = () => {
        try {
          websocket.close()
        } catch (error) {
          console.error('Error closing Home Assistant websocket:', error)
        }
        controller.close()
      }

      websocket.on('open', () => {
        // connection opened; waiting for auth_required message
      })

      websocket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())

          if (message.type === 'auth_required') {
            websocket.send(
              JSON.stringify({
                type: 'auth',
                access_token: ACCESS_TOKEN,
              })
            )
          } else if (message.type === 'auth_ok') {
            authenticated = true
            websocket.send(
              JSON.stringify({
                id: subscriptionId,
                type: 'subscribe_events',
                event_type: 'state_changed',
              })
            )
          } else if (message.type === 'auth_invalid') {
            console.error('Home Assistant authentication failed:', message)
            closeStream()
          } else if (
            message.type === 'event' &&
            message.event?.data?.entity_id
          ) {
            const entityId = message.event.data.entity_id
            if (entitySet.size === 0 || entitySet.has(entityId)) {
              const payload = {
                entity_id: entityId,
                new_state: message.event.data.new_state,
                old_state: message.event.data.old_state,
                time_fired: message.event.time_fired,
              }
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
              )
            }
          }
        } catch (error) {
          console.error('Error processing Home Assistant event:', error)
        }
      })

      websocket.on('error', (error) => {
        console.error('Home Assistant websocket error:', error)
        closeStream()
      })

      websocket.on('close', () => {
        controller.enqueue(new TextEncoder().encode('event: close\ndata: {}\n\n'))
        closeStream()
      })

      // If the client disconnects, terminate the HA websocket
      request.signal.addEventListener('abort', () => {
        closeStream()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

