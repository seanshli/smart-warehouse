/**
 * KNX Device API
 * Get specific KNX device by group address
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getKNXBridge } from '@/lib/mqtt-bridge/knx-bridge'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mqtt/knx/devices/[groupAddress]
 * Get specific KNX device
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { groupAddress: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { groupAddress } = params

    // Get MQTT broker configuration
    const mqttBrokerUrl = process.env.MQTT_BROKER_URL
    const mqttUsername = process.env.MQTT_USERNAME
    const mqttPassword = process.env.MQTT_PASSWORD

    if (!mqttBrokerUrl) {
      return NextResponse.json({
        error: 'MQTT broker not configured',
      }, { status: 503 })
    }

    try {
      // Initialize KNX bridge if not already initialized
      const bridge = getKNXBridge({
        mqttBrokerUrl,
        mqttUsername,
        mqttPassword,
      })

      // Start bridge if not running
      if (!bridge.isActive()) {
        await bridge.start()
      }

      // Normalize group address (handle both / and . formats)
      const normalizedAddress = groupAddress.replace(/_/g, '/').replace(/\./g, '/')
      const device = bridge.getDevice(normalizedAddress)

      if (!device) {
        return NextResponse.json({
          error: 'Device not found',
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        groupAddress: device.groupAddress,
        deviceId: device.groupAddress.replace(/\//g, '_').replace(/\./g, '_'),
        name: device.name,
        type: device.type,
        dpt: device.dpt,
        online: device.online,
      })
    } catch (bridgeError: any) {
      console.error('KNX Bridge error:', bridgeError)
      return NextResponse.json({
        error: bridgeError.message || 'Failed to get KNX device',
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error fetching KNX device:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KNX device', details: error.message },
      { status: 500 }
    )
  }
}
