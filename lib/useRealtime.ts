import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

interface RealtimeUpdate {
  type: 'connected' | 'update' | 'ping'
  data?: any
  message?: string
  timestamp: string
}

export function useRealtime(householdId: string, onUpdate?: (data: any) => void) {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!session?.user?.email || !householdId) return

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const eventSource = new EventSource(
        `/api/realtime?householdId=${householdId}`,
        { withCredentials: true }
      )

      eventSource.onopen = () => {
        console.log('Real-time connection opened')
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const update: RealtimeUpdate = JSON.parse(event.data)
          
          if (update.type === 'connected') {
            console.log('Real-time updates connected')
          } else if (update.type === 'update') {
            console.log('Real-time update received:', update.data)
            setLastUpdate(new Date())
            if (onUpdate) {
              onUpdate(update.data)
            }
          } else if (update.type === 'ping') {
            // Keep connection alive
            console.log('Real-time ping received')
          }
        } catch (error) {
          console.error('Error parsing real-time update:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('Real-time connection error:', error)
        setIsConnected(false)
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (session?.user?.email && householdId) {
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
  }, [session?.user?.email, householdId, onUpdate])

  return {
    isConnected,
    lastUpdate
  }
}
