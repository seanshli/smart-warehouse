/**
 * Admin MQTT Statistics API
 * Get MQTT connection statistics for all households
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMQTTConnectionStats, getMQTTClient } from '@/lib/mqtt-client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/mqtt/stats
 * Get MQTT connection statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    // Get MQTT connection statistics
    const connectionStats = getMQTTConnectionStats()
    
    // Get global MQTT client status
    const globalClient = getMQTTClient()
    const globalConnected = globalClient.isConnected()
    
    // Get broker configuration
    const brokerUrl = process.env.MQTT_BROKER_URL || 'not configured'
    const brokerType = brokerUrl.includes('emqx') ? 'EMQX' : 
                      brokerUrl.includes('hivemq') ? 'HiveMQ' :
                      brokerUrl.includes('mosquitto') ? 'Mosquitto' : 'Unknown'
    
    // Get household information for each connection
    const householdStats = await Promise.all(
      connectionStats
        .filter(stat => stat.householdId !== null)
        .map(async (stat) => {
          const household = await prisma.household.findUnique({
            where: { id: stat.householdId! },
            select: {
              id: true,
              name: true,
              createdAt: true,
            }
          }).catch(() => null)
          
          // Count IoT devices for this household
          const deviceCount = await prisma.ioTDevice.count({
            where: { householdId: stat.householdId! }
          }).catch(() => 0)
          
          return {
            ...stat,
            householdName: household?.name || 'Unknown',
            householdCreatedAt: household?.createdAt,
            deviceCount,
          }
        })
    )
    
    // Calculate summary statistics
    const totalConnections = connectionStats.length
    const activeConnections = connectionStats.filter(s => s.connected).length
    const totalHouseholds = householdStats.length
    const activeHouseholds = householdStats.filter(s => s.connected).length
    const totalMessagesPublished = connectionStats.reduce((sum, s) => sum + s.messagesPublished, 0)
    const totalMessagesReceived = connectionStats.reduce((sum, s) => sum + s.messagesReceived, 0)
    const totalSubscriptions = connectionStats.reduce((sum, s) => sum + s.subscriptions.length, 0)
    
    return NextResponse.json({
      broker: {
        url: brokerUrl,
        type: brokerType,
        globalConnected,
      },
      summary: {
        totalConnections,
        activeConnections,
        totalHouseholds,
        activeHouseholds,
        totalMessagesPublished,
        totalMessagesReceived,
        totalSubscriptions,
      },
      connections: connectionStats.map(stat => ({
        ...stat,
        connectedAt: stat.connectedAt?.toISOString(),
        lastActivity: stat.lastActivity?.toISOString(),
      })),
      households: householdStats.map(stat => ({
        ...stat,
        connectedAt: stat.connectedAt?.toISOString(),
        lastActivity: stat.lastActivity?.toISOString(),
        householdCreatedAt: stat.householdCreatedAt?.toISOString(),
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error fetching MQTT stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MQTT stats', details: error.message },
      { status: 500 }
    )
  }
}
