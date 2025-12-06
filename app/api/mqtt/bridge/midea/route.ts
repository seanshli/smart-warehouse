import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMideaBridge, MideaMQTTBridge } from '@/lib/mqtt-bridge/midea-bridge'

export const dynamic = 'force-dynamic'

/**
 * Midea MQTT Bridge Management API
 * GET: Get bridge status
 * POST: Start bridge
 * DELETE: Stop bridge
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get bridge instance (may not be initialized)
    try {
      const bridge = getMideaBridge()
      const devices = bridge.getDevices()

      return NextResponse.json({
        success: true,
        status: bridge.isActive() ? 'running' : 'stopped',
        devices,
        deviceCount: devices.length,
      })
    } catch (error: any) {
      // Bridge not initialized
      return NextResponse.json({
        success: true,
        status: 'stopped',
        devices: [],
        deviceCount: 0,
        message: 'Bridge not initialized',
      })
    }
  } catch (error: any) {
    console.error('Failed to get Midea bridge status:', error)
    return NextResponse.json(
      { error: 'Failed to get bridge status', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Start Midea MQTT Bridge
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      appId = process.env.MIDEA_CLIENT_ID,
      appKey = process.env.MIDEA_CLIENT_SECRET,
      mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
      mqttUsername = process.env.MQTT_USERNAME,
      mqttPassword = process.env.MQTT_PASSWORD,
      pollInterval = 5000,
    } = body

    if (!appId || !appKey || !mqttBrokerUrl) {
      const missingVars = []
      if (!appId) missingVars.push('MIDEA_CLIENT_ID')
      if (!appKey) missingVars.push('MIDEA_CLIENT_SECRET')
      if (!mqttBrokerUrl) missingVars.push('MQTT_BROKER_URL')
      
      return NextResponse.json(
        {
          error: 'Missing required configuration',
          message: `Missing required environment variables: ${missingVars.join(', ')}`,
          details: 'The Midea MQTT Bridge requires Midea Cloud API credentials and MQTT broker configuration.',
          required: {
            MIDEA_CLIENT_ID: 'Midea Cloud API Client ID (from Midea IoT Platform)',
            MIDEA_CLIENT_SECRET: 'Midea Cloud API Client Secret',
            MQTT_BROKER_URL: 'MQTT Broker URL (e.g., mqtt://broker.example.com:1883 or mqtts://broker.example.com:8883)',
            MQTT_USERNAME: 'MQTT Username (optional)',
            MQTT_PASSWORD: 'MQTT Password (optional)',
          },
          helpUrl: '/docs/MIDEA_MQTT_BRIDGE_GUIDE.md',
        },
        { status: 400 }
      )
    }

    // Initialize and start bridge
    const bridge = getMideaBridge({
      appId,
      appKey,
      mqttBrokerUrl,
      mqttUsername,
      mqttPassword,
      pollInterval,
    })

    if (bridge.isActive()) {
      return NextResponse.json({
        success: true,
        status: 'running',
        message: 'Bridge is already running',
        devices: bridge.getDevices(),
        deviceCount: bridge.getDevices().length,
      })
    }

    await bridge.start()

    return NextResponse.json({
      success: true,
      status: 'running',
      message: 'Midea MQTT Bridge started successfully',
      devices: bridge.getDevices(),
      deviceCount: bridge.getDevices().length,
    })
  } catch (error: any) {
    console.error('Failed to start Midea bridge:', error)
    return NextResponse.json(
      { error: 'Failed to start bridge', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Stop Midea MQTT Bridge
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const bridge = getMideaBridge()
      
      if (!bridge.isActive()) {
        return NextResponse.json({
          success: true,
          status: 'stopped',
          message: 'Bridge is already stopped',
        })
      }

      await bridge.stop()

      return NextResponse.json({
        success: true,
        status: 'stopped',
        message: 'Midea MQTT Bridge stopped successfully',
      })
    } catch (error: any) {
      // Bridge not initialized
      return NextResponse.json({
        success: true,
        status: 'stopped',
        message: 'Bridge was not running',
      })
    }
  } catch (error: any) {
    console.error('Failed to stop Midea bridge:', error)
    return NextResponse.json(
      { error: 'Failed to stop bridge', message: error.message },
      { status: 500 }
    )
  }
}

