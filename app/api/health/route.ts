import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMQTTClient } from '@/lib/mqtt-client'

export async function GET() {
  const healthStatus: {
    status: string
    database: string
    mqtt?: {
      connected: boolean
      brokerUrl?: string
      error?: string
    }
    responseTime?: string
    timestamp: string
  } = {
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString()
  }

  try {
    console.log('🏥 Health check: Testing database connection...')
    
    // Simple database query to test connection
    const startTime = Date.now()
    const result = await prisma.$queryRaw`SELECT 1 as test`
    const endTime = Date.now()
    
    const responseTime = endTime - startTime
    healthStatus.responseTime = `${responseTime}ms`
    
    console.log('🏥 Health check: Database response time:', responseTime, 'ms')
  } catch (error) {
    console.error('🏥 Health check: Database connection failed:', error)
    healthStatus.status = 'unhealthy'
    healthStatus.database = 'disconnected'
    
    return NextResponse.json({
      ...healthStatus,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }

  // Check MQTT broker status
  try {
    console.log('🏥 Health check: Testing MQTT broker connection...')
    const mqttClient = getMQTTClient()
    const isConnected = mqttClient.isConnected()
    
    healthStatus.mqtt = {
      connected: isConnected,
      brokerUrl: process.env.MQTT_BROKER_URL || 'not configured',
    }
    
    // Try to connect if not connected (non-blocking)
    if (!isConnected) {
      try {
        await Promise.race([
          mqttClient.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('MQTT connection timeout')), 5000)
          )
        ])
        healthStatus.mqtt.connected = true
        console.log('🏥 Health check: MQTT broker connected')
      } catch (mqttError: any) {
        console.warn('🏥 Health check: MQTT broker not connected:', mqttError.message)
        healthStatus.mqtt.connected = false
        healthStatus.mqtt.error = mqttError.message
        // Don't fail health check if MQTT is not available (it's optional for some features)
      }
    } else {
      console.log('🏥 Health check: MQTT broker already connected')
    }
  } catch (error) {
    console.warn('🏥 Health check: MQTT check failed:', error)
    healthStatus.mqtt = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      brokerUrl: process.env.MQTT_BROKER_URL || 'not configured',
    }
    // Don't fail health check if MQTT check fails
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 : 500
  return NextResponse.json(healthStatus, { status: statusCode })
}
