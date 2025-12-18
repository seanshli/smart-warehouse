// Shelly MQTT Bridge Service
// 管理通过 MQTT 连接的 Shelly 设备
// Manages Shelly devices connected via MQTT broker

import { getMQTTClient } from '../mqtt-client'
import { ShellyAdapter } from '../mqtt-adapters/shelly-adapter'

interface ShellyDevice {
  deviceId: string // Shelly device ID (e.g., shelly1-1234 or shellyplus1-5678)
  name: string
  type: string
  generation: 'gen1' | 'gen2'
  online: boolean
  channels: number // Number of relays/switches
  [key: string]: any
}

interface ShellyBridgeConfig {
  mqttBrokerUrl: string
  mqttUsername?: string
  mqttPassword?: string
  shellyPrefix?: string // Default: 'shellies' for Gen1
  pollInterval?: number // Polling interval for device discovery (milliseconds), default 10000
}

/**
 * Shelly MQTT Bridge Service
 * 管理通过 MQTT 连接的 Shelly 设备
 * Shelly devices connect directly to MQTT broker
 * This bridge service manages device discovery and monitoring
 */
export class ShellyMQTTBridge {
  private config: ShellyBridgeConfig
  private mqttClient: ReturnType<typeof getMQTTClient>
  private devices: Map<string, ShellyDevice> = new Map()
  private isRunning = false
  private shellyPrefix: string
  private pollingInterval: NodeJS.Timeout | null = null

  constructor(config: ShellyBridgeConfig) {
    this.config = {
      shellyPrefix: 'shellies',
      pollInterval: 10000, // 10 seconds for device discovery
      ...config,
    }
    this.shellyPrefix = this.config.shellyPrefix!
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
      console.log('Shelly Bridge: Already running')
      return
    }

    console.log('Shelly Bridge: Starting...')

    // 连接到 MQTT Broker
    if (!this.mqttClient.isConnected()) {
      await this.mqttClient.connect()
    }

    // 订阅所有 Shelly Gen1 设备状态主题
    await this.mqttClient.subscribe(`${this.shellyPrefix}/+/relay/+`, 1)
    await this.mqttClient.subscribe(`${this.shellyPrefix}/+/status`, 1)
    await this.mqttClient.subscribe(`${this.shellyPrefix}/+/announce`, 1)

    // 订阅所有 Shelly Gen2 设备状态主题 (格式: {topic_prefix}/status/switch:{id})
    await this.mqttClient.subscribe('+/status/switch:+', 1)
    await this.mqttClient.subscribe('+/status/input:+', 1)
    await this.mqttClient.subscribe('+/announce', 1)

    // 设置消息处理器
    this.mqttClient.onMessage(`${this.shellyPrefix}/+`, async (message) => {
      await this.handleMessage(message)
    })

    // 订阅通用主题以捕获 Gen2 设备
    this.mqttClient.onMessage('+/status/switch:+', async (message) => {
      await this.handleMessage(message)
    })

    this.mqttClient.onMessage('+/announce', async (message) => {
      await this.handleMessage(message)
    })

    // 开始定期设备发现
    await this.discoverDevices()
    this.startPolling()

    this.isRunning = true
    console.log('Shelly Bridge: Started successfully')
  }

  /**
   * 停止桥接服务
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    console.log('Shelly Bridge: Stopping...')

    // 停止轮询
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    // 取消订阅
    await this.mqttClient.unsubscribe(`${this.shellyPrefix}/+`)
    await this.mqttClient.unsubscribe('+/status/switch:+')
    await this.mqttClient.unsubscribe('+/announce')

    // 断开 MQTT 连接
    await this.mqttClient.disconnect()

    this.isRunning = false
    console.log('Shelly Bridge: Stopped')
  }

  /**
   * 发现 Shelly 设备
   */
  private async discoverDevices(): Promise<void> {
    try {
      // Request device announcements (Gen1 devices)
      await this.mqttClient.publish({
        topic: `${this.shellyPrefix}/command`,
        payload: 'announce',
        qos: 0,
      })

      // For Gen2 devices, they automatically announce on connect
      // We'll discover them from status messages
    } catch (error) {
      console.error('Shelly Bridge: Failed to request device announcements:', error)
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

      // 处理设备公告 (Gen1)
      if (topic.endsWith('/announce')) {
        await this.handleAnnouncement(topic, payload)
        return
      }

      // 处理设备状态更新
      if (topic.includes('/relay/') || topic.includes('/status/switch:') || topic.includes('/status/input:')) {
        await this.handleDeviceStatus(topic, payload)
      }
    } catch (error) {
      console.error('Shelly Bridge: Error handling message:', error)
    }
  }

  /**
   * 处理设备公告
   */
  private async handleAnnouncement(topic: string, payload: string): Promise<void> {
    try {
      const data = JSON.parse(payload)
      const topicParts = topic.split('/')
      
      // Gen1 format: shellies/{device_id}/announce
      // Gen2 format: {topic_prefix}/announce
      let deviceId: string
      let generation: 'gen1' | 'gen2'

      if (topic.startsWith(this.shellyPrefix)) {
        // Gen1 device
        deviceId = topicParts[1]
        generation = 'gen1'
      } else {
        // Gen2 device
        deviceId = topicParts[0]
        generation = 'gen2'
      }

      const deviceInfo: ShellyDevice = {
        deviceId,
        name: data.name || data.id || deviceId,
        type: data.type || data.model || 'unknown',
        generation,
        online: true,
        channels: data.num_outputs || data.switches?.length || 1,
        ...data,
      }

      this.devices.set(deviceId, deviceInfo)
      console.log(`Shelly Bridge: Discovered device ${deviceId} (${generation})`)
    } catch (error) {
      console.error('Shelly Bridge: Failed to parse announcement:', error)
    }
  }

  /**
   * 处理设备状态更新
   */
  private async handleDeviceStatus(topic: string, payload: string): Promise<void> {
    try {
      const parsed = ShellyAdapter.parseDeviceId(topic)
      
      if (!parsed.deviceId) {
        return
      }

      const { deviceId, channel, generation } = parsed
      const state = ShellyAdapter.parseStateMessage(
        { topic, payload },
        generation
      )

      if (state) {
        // 更新设备状态
        const device = this.devices.get(deviceId)
        if (device) {
          device.online = true
          // Update channel count if needed
          if (channel !== undefined && channel >= device.channels) {
            device.channels = channel + 1
          }
          this.devices.set(deviceId, device)
        } else {
          // 新设备，添加到列表
          const newDevice: ShellyDevice = {
            deviceId,
            name: deviceId,
            type: 'unknown',
            generation: generation || 'gen1',
            online: true,
            channels: channel !== undefined ? channel + 1 : 1,
          }
          this.devices.set(deviceId, newDevice)
          console.log(`Shelly Bridge: Discovered new device ${deviceId} from status message`)
        }
      }
    } catch (error) {
      console.error('Shelly Bridge: Failed to handle device status:', error)
    }
  }

  /**
   * 发送控制命令到设备
   */
  async sendCommand(deviceId: string, command: any, channel?: number, generation?: 'gen1' | 'gen2'): Promise<boolean> {
    try {
      // Detect generation if not provided
      if (!generation) {
        const device = this.devices.get(deviceId)
        generation = device?.generation || ShellyAdapter.detectGeneration(deviceId)
      }

      const commandMessage = ShellyAdapter.createCommandMessage(
        deviceId,
        {
          action: command.action || command,
          channel: channel ?? 0,
          generation,
        },
        generation
      )

      await this.mqttClient.publish(commandMessage)
      return true
    } catch (error) {
      console.error(`Shelly Bridge: Failed to send command to device ${deviceId}:`, error)
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
  getDevices(): ShellyDevice[] {
    return Array.from(this.devices.values())
  }

  /**
   * 获取特定设备
   */
  getDevice(deviceId: string): ShellyDevice | undefined {
    return this.devices.get(deviceId)
  }

  /**
   * 获取设备的通道数量
   */
  getDeviceChannels(deviceId: string): number {
    const device = this.devices.get(deviceId)
    return device?.channels || 1
  }
}

// 单例实例
let shellyBridgeInstance: ShellyMQTTBridge | null = null

/**
 * 获取或创建 Shelly Bridge 实例
 */
export function getShellyBridge(config?: ShellyBridgeConfig): ShellyMQTTBridge {
  if (!shellyBridgeInstance && config) {
    shellyBridgeInstance = new ShellyMQTTBridge(config)
  }
  
  if (!shellyBridgeInstance) {
    throw new Error('Shelly Bridge not initialized. Please provide config.')
  }
  
  return shellyBridgeInstance
}
