/**
 * MQTT Broker Status API
 * Check if MQTT broker is connected and active
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMQTTClient } from '@/lib/mqtt-client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mqtt/status
 * Get MQTT broker connection status
 */
export async function GET(request: NextRequest) {
  try {
    const mqttClient = getMQTTClient()
    const isConnected = mqttClient.isConnected()
    
    // Try to connect if not connected
    if (!isConnected) {
      try {
        console.log('[MQTT Status] Attempting to connect to MQTT broker...')
        await mqttClient.connect()
        console.log('[MQTT Status] Successfully connected to MQTT broker')
      } catch (connectError: any) {
        console.error('[MQTT Status] Failed to connect to MQTT broker:', connectError)
        return NextResponse.json({
          connected: false,
          error: connectError.message || 'Failed to connect to MQTT broker',
          brokerUrl: process.env.MQTT_BROKER_URL || 'not configured',
          timestamp: new Date().toISOString(),
        }, { status: 503 })
      }
    }

    // Get broker URL from config
    const brokerUrl = process.env.MQTT_BROKER_URL || 'not configured'
    
    return NextResponse.json({
      connected: true,
      brokerUrl,
      clientId: process.env.MQTT_CLIENT_ID || 'smart-warehouse-dev',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[MQTT Status] Error checking MQTT status:', error)
    return NextResponse.json({
      connected: false,
      error: error.message || 'Unknown error',
      brokerUrl: process.env.MQTT_BROKER_URL || 'not configured',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

/**
 * POST /api/mqtt/status
 * Force reconnect to MQTT broker
 */
export async function POST(request: NextRequest) {
  try {
    const mqttClient = getMQTTClient()
    
    // Disconnect if connected
    if (mqttClient.isConnected()) {
      console.log('[MQTT Status] Disconnecting from MQTT broker...')
      await mqttClient.disconnect()
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Reconnect
    console.log('[MQTT Status] Reconnecting to MQTT broker...')
    await mqttClient.connect()
    
    return NextResponse.json({
      success: true,
      connected: true,
      message: 'Successfully reconnected to MQTT broker',
      brokerUrl: process.env.MQTT_BROKER_URL || 'not configured',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[MQTT Status] Error reconnecting to MQTT broker:', error)
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message || 'Failed to reconnect to MQTT broker',
      brokerUrl: process.env.MQTT_BROKER_URL || 'not configured',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
