// MQTT Device Discovery API
// 掃描 MQTT Broker 上已連接的設備
// Scan for devices connected to MQTT Broker

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import mqtt from 'mqtt'

export const dynamic = 'force-dynamic'

// MQTT 客戶端緩存
let mqttClient: mqtt.MqttClient | null = null

async function getMQTTClient() {
  if (mqttClient && mqttClient.connected) {
    return mqttClient
  }

  const brokerUrl = process.env.MQTT_BROKER_URL
  const brokerUsername = process.env.MQTT_BROKER_USERNAME
  const brokerPassword = process.env.MQTT_BROKER_PASSWORD

  if (!brokerUrl) {
    throw new Error('MQTT broker URL not configured')
  }

  return new Promise<mqtt.MqttClient>((resolve, reject) => {
    const client = mqtt.connect(brokerUrl, {
      username: brokerUsername,
      password: brokerPassword,
      clientId: `smart-warehouse-discovery-${Date.now()}`,
      clean: true,
    })

    client.on('connect', () => {
      console.log('[mqtt] Discovery client connected')
      mqttClient = client
      resolve(client)
    })

    client.on('error', (error) => {
      console.error('[mqtt] Discovery client error:', error)
      reject(error)
    })

    // 設置超時
    setTimeout(() => {
      if (!client.connected) {
        client.end()
        reject(new Error('MQTT connection timeout'))
      }
    }, 10000)
  })
}

/**
 * GET /api/mqtt/discover
 * 掃描 MQTT Broker 上已連接的設備
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vendor = searchParams.get('vendor') || 'all' // tuya, midea, esp, shelly, aqara, all
    const timeout = parseInt(searchParams.get('timeout') || '10000', 10)

    console.log(`[mqtt] Starting device discovery for vendor: ${vendor}, timeout: ${timeout}ms`)

    // 獲取 MQTT 客戶端
    const client = await getMQTTClient()

    // 根據供應商選擇主題模式
    const topicPatterns: Record<string, string[]> = {
      tuya: [
        'tuya/+/status',
        'tuya/+/state',
        'smart/device/+/status',
      ],
      midea: [
        'midea/+/status',
        'midea/+/state',
        'appliance/+/status',
      ],
      esp: [
        'esp/+/status',
        'esp/+/state',
        'device/+/status',
      ],
      shelly: [
        'shellies/+/relay/+', // Gen 1: shellies/<device>/relay/<channel>
        'shellies/+/relay/+/command', // Gen 1 command topic (for discovery)
        '+/status/switch:+', // Gen 2: <prefix>/status/switch:<id>
        '+/command/switch:+', // Gen 2 command topic (for discovery)
      ],
      aqara: [
        'zigbee2mqtt/+', // Zigbee2MQTT device status topics
        'zigbee2mqtt/+/set', // Zigbee2MQTT command topics (for discovery)
      ],
      all: [
        'tuya/+/status',
        'tuya/+/state',
        'midea/+/status',
        'midea/+/state',
        'esp/+/status',
        'esp/+/state',
        'shellies/+/relay/+', // Shelly Gen 1
        '+/status/switch:+', // Shelly Gen 2
        'zigbee2mqtt/+', // Aqara via Zigbee2MQTT
        'smart/device/+/status',
        'appliance/+/status',
        'device/+/status',
      ],
    }

    const topics = topicPatterns[vendor] || topicPatterns.all

    // 訂閱所有相關主題
    const subscribedTopics: string[] = []
    const discoveredDevices: Map<string, any> = new Map()

    // 訂閱主題
    await new Promise<void>((resolve, reject) => {
      const subscribePromises = topics.map(topic => {
        return new Promise<void>((subResolve, subReject) => {
          client.subscribe(topic, { qos: 1 }, (err, granted) => {
            if (err) {
              console.error(`[mqtt] Failed to subscribe to ${topic}:`, err)
              subReject(err)
            } else {
              console.log(`[mqtt] Subscribed to ${topic}`)
              subscribedTopics.push(topic)
              subResolve()
            }
          })
        })
      })

      Promise.all(subscribePromises)
        .then(() => resolve())
        .catch(reject)
    })

    // 監聽消息
    const messageHandler = (topic: string, message: Buffer) => {
      try {
        const payload = JSON.parse(message.toString())
        const topicParts = topic.split('/')
        
        // 從主題中提取設備 ID
        let deviceId = topicParts[1] || topicParts[topicParts.length - 2]
        let deviceVendor = 'unknown'
        let commandTopic: string | undefined
        let statusTopic: string | undefined

        // 根據主題判斷供應商
        if (topic.startsWith('zigbee2mqtt/')) {
          deviceVendor = 'aqara'
          // Aqara/Zigbee2MQTT 格式：zigbee2mqtt/<device_friendly_name> 或 zigbee2mqtt/<device_friendly_name>/set
          const parts = topic.split('/')
          if (parts.length >= 2 && parts[1] !== 'bridge') {
            deviceId = parts[1] // 設備友好名稱
            if (topic.includes('/set')) {
              commandTopic = topic
              statusTopic = `zigbee2mqtt/${deviceId}`
            } else {
              statusTopic = topic
              commandTopic = `zigbee2mqtt/${deviceId}/set`
            }
          }
        } else if (topic.startsWith('shellies/') || topic.includes('/status/switch:') || topic.includes('/command/switch:')) {
          deviceVendor = 'shelly'
          // Shelly Gen 1: shellies/<device>/relay/<channel>
          if (topic.startsWith('shellies/')) {
            deviceId = topicParts[1] // device name
            const channel = topicParts[3] || '0'
            if (topic.includes('/command')) {
              commandTopic = topic
              statusTopic = `shellies/${deviceId}/relay/${channel}`
            } else {
              statusTopic = topic
              commandTopic = `shellies/${deviceId}/relay/${channel}/command`
            }
          } else {
            // Shelly Gen 2: <prefix>/status/switch:<id> or <prefix>/command/switch:<id>
            const match = topic.match(/^([^/]+)\/(?:status|command)\/switch:(\d+)$/)
            if (match) {
              deviceId = match[1]
              const switchId = match[2]
              if (topic.includes('/command')) {
                commandTopic = topic
                statusTopic = `${deviceId}/status/switch:${switchId}`
              } else {
                statusTopic = topic
                commandTopic = `${deviceId}/command/switch:${switchId}`
              }
            }
          }
        } else if (topic.includes('tuya') || topic.includes('smart/device')) {
          deviceVendor = 'tuya'
        } else if (topic.includes('midea') || topic.includes('appliance')) {
          deviceVendor = 'midea'
        } else if (topic.includes('esp') || topic.includes('device/')) {
          deviceVendor = 'esp'
        }

        // 如果沒有設備 ID，嘗試從 payload 中獲取
        if (!deviceId && payload.deviceId) {
          deviceId = payload.deviceId
        }

        if (deviceId) {
          const deviceKey = `${deviceVendor}_${deviceId}`
          
          // 對於 Shelly，解析狀態（可能是簡單的 on/off 字串）
          let parsedState = payload
          if (deviceVendor === 'shelly') {
            try {
              // 嘗試解析 JSON
              parsedState = typeof payload === 'string' ? JSON.parse(payload) : payload
            } catch {
              // 如果不是 JSON，可能是簡單的 on/off
              parsedState = { power: payload === 'on' || payload === 'ON' }
            }
          }
          
          if (!discoveredDevices.has(deviceKey)) {
            discoveredDevices.set(deviceKey, {
              deviceId,
              vendor: deviceVendor,
              name: parsedState.name || parsedState.deviceName || `${deviceVendor}_${deviceId}`,
              status: parsedState.status || parsedState.state || parsedState.power ? 'online' : 'offline',
              state: parsedState,
              topic: statusTopic || topic,
              commandTopic: commandTopic,
              statusTopic: statusTopic || topic,
              lastSeen: new Date().toISOString(),
            })
          } else {
            // 更新現有設備
            const existing = discoveredDevices.get(deviceKey)!
            existing.status = parsedState.status || parsedState.state || parsedState.power ? 'online' : 'offline'
            existing.state = parsedState
            existing.lastSeen = new Date().toISOString()
            if (statusTopic) existing.statusTopic = statusTopic
            if (commandTopic) existing.commandTopic = commandTopic
          }
        }
      } catch (error) {
        console.error(`[mqtt] Failed to parse message from ${topic}:`, error)
      }
    }

    client.on('message', messageHandler)

    // 等待指定時間收集設備
    await new Promise(resolve => setTimeout(resolve, timeout))

    // 清理：取消訂閱並移除監聽器
    subscribedTopics.forEach(topic => {
      client.unsubscribe(topic)
    })
    client.removeListener('message', messageHandler)

    const devices = Array.from(discoveredDevices.values())

    console.log(`[mqtt] Discovery completed: found ${devices.length} devices`)

    return NextResponse.json({
      success: true,
      devices,
      count: devices.length,
      vendor,
      timeout,
    })
  } catch (error: any) {
    console.error('[mqtt] Device discovery error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to discover devices',
        devices: [],
      },
      { status: 500 }
    )
  }
}

