import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

interface RealtimeUpdate {
  type: 'connected' | 'update' | 'ping' | 'doorbell'
  data?: any
  message?: string
  timestamp: string
}

/**
 * Hook for building-level realtime updates (for front desk)
 */
export function useBuildingRealtime(buildingId: string, onUpdate?: (data: any) => void) {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!session?.user?.email || !buildingId) return

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const eventSource = new EventSource(
        `/api/building/${buildingId}/realtime`,
        { withCredentials: true }
      )

      eventSource.onopen = () => {
        console.log('Building real-time connection opened')
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const update: RealtimeUpdate = JSON.parse(event.data)
          
          if (update.type === 'connected') {
            console.log('Building real-time updates connected')
          } else if (update.type === 'update' || update.type === 'doorbell') {
            console.log('Building real-time update received:', update.data)
            setLastUpdate(new Date())
            if (onUpdate) {
              onUpdate(update.data)
            }
          } else if (update.type === 'ping') {
            // Keep connection alive
            console.log('Building real-time ping received')
          }
        } catch (error) {
          console.error('Error parsing building real-time update:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('Building real-time connection error:', error)
        setIsConnected(false)
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (session?.user?.email && buildingId) {
            connect()
          }
        }, 5000)
      }

      eventSourceRef.current = eventSource
    }

    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsConnected(false)
    }
  }, [session?.user?.email, buildingId, onUpdate])

  return {
    isConnected,
    lastUpdate
  }
}

