// ESP MQTT Bridge Service
// 管理通过 MQTT 连接的 ESP 设备（ESP32/ESP8266）
// Manages ESP devices (ESP32/ESP8266) connected via MQTT broker

import { getMQTTClient } from '../mqtt-client'
import { ESPAdapter } from '../mqtt-adapters/esp-adapter'

interface ESPDevice {
  deviceId: string // ESP device ID (MAC address or custom ID)
  name: string
  type: string
  chipType?: 'ESP32' | 'ESP8266' | 'unknown'
  online: boolean
  ipAddress?: string
  macAddress?: string
  [key: string]: any
}

interface ESPBridgeConfig {
  mqttBrokerUrl: string
  mqttUsername?: string
  mqttPassword?: string
  espPrefix?: string // Default: 'esp'
  pollInterval?: number // Polling interval for device discovery (milliseconds), default 10000
}

/**
 * ESP MQTT Bridge Service
 * 管理通过 MQTT 连接的 ESP 设备
 * ESP devices connect directly to MQTT broker
 * This bridge service manages device discovery and monitoring
 */
export class ESPMQTTBridge {
  private config: ESPBridgeConfig
  private mqttClient: ReturnType<typeof getMQTTClient>
  private devices: Map<string, ESPDevice> = new Map()
  private isRunning = false
  private espPrefix: string
  private pollingInterval: NodeJS.Timeout | null = null

  constructor(config: ESPBridgeConfig) {
    this.config = {
      espPrefix: 'esp',
      pollInterval: 10000, // 10 seconds for device discovery
      ...config,
    }
    this.espPrefix = this.config.espPrefix!
    this.mqttClient = getMQTTClient({
      brokerUrl: config.mqttBrokerUrl,
      username: config.mqttUsername,
      password: config.mqttPassword,
    })
  }

  /**
   * 启动桥接服务
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('ESP Bridge: Already running')
      return
    }

    console.log('ESP Bridge: Starting...')

    // 连接到 MQTT Broker
    if (!this.mqttClient.isConnected()) {
      await this.mqttClient.connect()
    }

    // 订阅所有 ESP 设备状态主题
    await this.mqttClient.subscribe(`${this.espPrefix}/+/status`, 1)
    await this.mqttClient.subscribe(`${this.espPrefix}/+/state`, 1)
    await this.mqttClient.subscribe(`${this.espPrefix}/+/telemetry`, 1)
    await this.mqttClient.subscribe(`${this.espPrefix}/+/announce`, 1)
    await this.mqttClient.subscribe(`${this.espPrefix}/+/info`, 1)

    // 设置消息处理器
    this.mqttClient.onMessage(`${this.espPrefix}/+`, async (message) => {
      await this.handleMessage(message)
    })

    // 开始定期设备发现
    await this.discoverDevices()
    this.startPolling()

    this.isRunning = true
    console.log('ESP Bridge: Started successfully')
  }

  /**
   * 停止桥接服务
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    console.log('ESP Bridge: Stopping...')

    // 停止轮询
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    // 取消订阅
    await this.mqttClient.unsubscribe(`${this.espPrefix}/+`)

    // 断开 MQTT 连接
    await this.mqttClient.disconnect()

    this.isRunning = false
    console.log('ESP Bridge: Stopped')
  }

  /**
   * 发现 ESP 设备
   */
  private async discoverDevices(): Promise<void> {
    try {
      // Request device announcements
      await this.mqttClient.publish({
        topic: `${this.espPrefix}/announce`,
        payload: JSON.stringify({ action: 'discover' }),
        qos: 0,
      })

      // ESP devices typically announce themselves on connect
      // We'll discover them from status/announce messages
    } catch (error) {
      console.error('ESP Bridge: Failed to request device announcements:', error)
    }
  }

  /**
   * 处理来自 MQTT 的消息
   */
  private async handleMessage(message: any): Promise<void> {
    try {
      const topic = message.topic
      const payload = typeof message.payload === 'string'
        ? message.payload
        : message.payload.toString()

      // 处理设备公告
      if (topic.endsWith('/announce') || topic.endsWith('/info')) {
        await this.handleAnnouncement(topic, payload)
        return
      }

      // 处理设备状态更新
      if (topic.includes('/status') || topic.includes('/state') || topic.includes('/telemetry')) {
        await this.handleDeviceStatus(topic, payload)
      }
    } catch (error) {
      console.error('ESP Bridge: Error handling message:', error)
    }
  }

  /**
   * 处理设备公告
   */
  private async handleAnnouncement(topic: string, payload: string): Promise<void> {
    try {
      const data = JSON.parse(payload)
      const topicParts = topic.split('/')
      
      // ESP format: esp/{device_id}/announce or esp/{device_id}/info
      let deviceId: string
      if (topicParts.length >= 2) {
        deviceId = topicParts[1]
      } else {
        return
      }

      const deviceInfo: ESPDevice = {
        deviceId,
        name: data.name || data.deviceName || data.hostname || deviceId,
        type: data.type || data.deviceType || 'unknown',
        chipType: this.detectChipType(data.chipType || data.chip || data.model),
        online: true,
        ipAddress: data.ip || data.ipAddress,
        macAddress: data.mac || data.macAddress,
        ...data,
      }

      this.devices.set(deviceId, deviceInfo)
      console.log(`ESP Bridge: Discovered device ${deviceId} (${deviceInfo.chipType})`)
    } catch (error) {
      console.error('ESP Bridge: Failed to parse announcement:', error)
    }
  }

  /**
   * 检测芯片类型
   */
  private detectChipType(chipInfo: string | undefined): 'ESP32' | 'ESP8266' | 'unknown' {
    if (!chipInfo) return 'unknown'
    
    const chipLower = chipInfo.toLowerCase()
    if (chipLower.includes('esp32')) {
      return 'ESP32'
    } else if (chipLower.includes('esp8266')) {
      return 'ESP8266'
    }
    
    return 'unknown'
  }

  /**
   * 处理设备状态更新
   */
  private async handleDeviceStatus(topic: string, payload: string): Promise<void> {
    try {
      const deviceId = ESPAdapter.parseDeviceId(topic)
      
      if (!deviceId) {
        return
      }

      const state = ESPAdapter.parseStateMessage({
        topic,
        payload,
      })

      if (state) {
        // 更新设备状态
        const device = this.devices.get(deviceId)
        if (device) {
          device.online = true
          this.devices.set(deviceId, device)
        } else {
          // 新设备，添加到列表
          const newDevice: ESPDevice = {
            deviceId,
            name: deviceId,
            type: 'unknown',
            chipType: 'unknown',
            online: true,
          }
          this.devices.set(deviceId, newDevice)
          console.log(`ESP Bridge: Discovered new device ${deviceId} from status message`)
        }
      }
    } catch (error) {
      console.error('ESP Bridge: Failed to handle device status:', error)
    }
  }

  /**
   * 发送控制命令到设备
   */
  async sendCommand(deviceId: string, command: any): Promise<boolean> {
    try {
      const commandMessage = ESPAdapter.createCommandMessage(deviceId, command)
      await this.mqttClient.publish(commandMessage)
      return true
    } catch (error) {
      console.error(`ESP Bridge: Failed to send command to device ${deviceId}:`, error)
      return false
    }
  }

  /**
   * 开始定期轮询设备发现
   */
  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }

    this.pollingInterval = setInterval(() => {
      this.discoverDevices()
    }, this.config.pollInterval)
  }

  /**
   * 获取运行状态
   */
  isActive(): boolean {
    return this.isRunning
  }

  /**
   * 获取设备列表
   */
  getDevices(): ESPDevice[] {
    return Array.from(this.devices.values())
  }

  /**
   * 获取特定设备
   */
  getDevice(deviceId: string): ESPDevice | undefined {
    return this.devices.get(deviceId)
  }
}

// 单例实例
let espBridgeInstance: ESPMQTTBridge | null = null

/**
 * 获取或创建 ESP Bridge 实例
 */
export function getESPBridge(config?: ESPBridgeConfig): ESPMQTTBridge {
  if (!espBridgeInstance && config) {
    espBridgeInstance = new ESPMQTTBridge(config)
  }
  
  if (!espBridgeInstance) {
    throw new Error('ESP Bridge not initialized. Please provide config.')
  }
  
  return espBridgeInstance
}
