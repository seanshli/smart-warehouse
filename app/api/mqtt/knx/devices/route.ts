/**
 * KNX Devices API
 * Get list of KNX devices from KNX bridge service
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getKNXBridge } from '@/lib/mqtt-bridge/knx-bridge'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mqtt/knx/devices
 * Get list of KNX devices
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get MQTT broker configuration
    const mqttBrokerUrl = process.env.MQTT_BROKER_URL
    const mqttUsername = process.env.MQTT_USERNAME
    const mqttPassword = process.env.MQTT_PASSWORD

    if (!mqttBrokerUrl) {
      return NextResponse.json({
        error: 'MQTT broker not configured',
        devices: [],
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

      // Get devices
      const devices = bridge.getDevices()

      return NextResponse.json({
        success: true,
        devices: devices.map(device => ({
          groupAddress: device.groupAddress,
          deviceId: device.groupAddress.replace(/\//g, '_').replace(/\./g, '_'),
          name: device.name,
          type: device.type,
          dpt: device.dpt,
          online: device.online,
        })),
        count: devices.length,
      })
    } catch (bridgeError: any) {
      console.error('KNX Bridge error:', bridgeError)
      return NextResponse.json({
        error: bridgeError.message || 'Failed to get KNX devices',
        devices: [],
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error fetching KNX devices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KNX devices', details: error.message },
      { status: 500 }
    )
  }
}
