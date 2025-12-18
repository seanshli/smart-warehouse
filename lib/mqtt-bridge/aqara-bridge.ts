// Aqara MQTT Bridge Service
// 管理通过 Zigbee2MQTT 连接的 Aqara 设备
// Manages Aqara devices connected via Zigbee2MQTT

import { getMQTTClient } from '../mqtt-client'
import { AqaraAdapter } from '../mqtt-adapters/aqara-adapter'

interface AqaraDevice {
  deviceId: string // Zigbee2MQTT friendly name
  name: string
  type: string
  online: boolean
  [key: string]: any
}

interface AqaraBridgeConfig {
  mqttBrokerUrl: string
  mqttUsername?: string
  mqttPassword?: string
  zigbee2mqttPrefix?: string // Default: 'zigbee2mqtt'
}

/**
 * Aqara MQTT Bridge Service
 * 管理通过 Zigbee2MQTT 连接的 Aqara 设备
 * Aqara devices connect directly to MQTT broker via Zigbee2MQTT gateway
 * This bridge service manages device discovery and monitoring
 */
export class AqaraMQTTBridge {
  private config: AqaraBridgeConfig
  private mqttClient: ReturnType<typeof getMQTTClient>
  private devices: Map<string, AqaraDevice> = new Map()
  private isRunning = false
  private zigbee2mqttPrefix: string

  constructor(config: AqaraBridgeConfig) {
    this.config = {
      zigbee2mqttPrefix: 'zigbee2mqtt',
      ...config,
    }
    this.zigbee2mqttPrefix = this.config.zigbee2mqttPrefix!
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
      console.log('Aqara Bridge: Already running')
      return
    }

    console.log('Aqara Bridge: Starting...')

    // 连接到 MQTT Broker
    if (!this.mqttClient.isConnected()) {
      await this.mqttClient.connect()
    }

    // 订阅所有 Zigbee2MQTT 设备状态主题
    await this.mqttClient.subscribe(`${this.zigbee2mqttPrefix}/+`, 1)

    // 订阅 Zigbee2MQTT bridge 状态（设备列表）
    await this.mqttClient.subscribe(`${this.zigbee2mqttPrefix}/bridge/state`, 1)
    await this.mqttClient.subscribe(`${this.zigbee2mqttPrefix}/bridge/devices`, 1)

    // 设置消息处理器
    this.mqttClient.onMessage(`${this.zigbee2mqttPrefix}/+`, async (message) => {
      await this.handleMessage(message)
    })

    // 请求设备列表
    await this.requestDeviceList()

    this.isRunning = true
    console.log('Aqara Bridge: Started successfully')
  }

  /**
   * 停止桥接服务
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    console.log('Aqara Bridge: Stopping...')

    // 取消订阅
    await this.mqttClient.unsubscribe(`${this.zigbee2mqttPrefix}/+`)
    await this.mqttClient.unsubscribe(`${this.zigbee2mqttPrefix}/bridge/state`)
    await this.mqttClient.unsubscribe(`${this.zigbee2mqttPrefix}/bridge/devices`)

    // 断开 MQTT 连接
    await this.mqttClient.disconnect()

    this.isRunning = false
    console.log('Aqara Bridge: Stopped')
  }

  /**
   * 请求 Zigbee2MQTT 设备列表
   */
  private async requestDeviceList(): Promise<void> {
    try {
      // 发布请求到 bridge/config/devices
      await this.mqttClient.publish({
        topic: `${this.zigbee2mqttPrefix}/bridge/config/devices/get`,
        payload: '',
        qos: 0,
      })
    } catch (error) {
      console.error('Aqara Bridge: Failed to request device list:', error)
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

      // 处理设备列表
      if (topic === `${this.zigbee2mqttPrefix}/bridge/config/devices` || 
          topic === `${this.zigbee2mqttPrefix}/bridge/devices`) {
        await this.handleDeviceList(payload)
        return
      }

      // 处理设备状态更新
      if (topic.startsWith(`${this.zigbee2mqttPrefix}/`) && 
          !topic.includes('/bridge/') && 
          !topic.includes('/set`)) {
        const deviceId = AqaraAdapter.parseDeviceId(topic)
        if (deviceId) {
          await this.handleDeviceStatus(deviceId, payload)
        }
      }
    } catch (error) {
      console.error('Aqara Bridge: Error handling message:', error)
    }
  }

  /**
   * 处理设备列表
   */
  private async handleDeviceList(payload: string): Promise<void> {
    try {
      const devices = JSON.parse(payload)
      const deviceList = Array.isArray(devices) ? devices : []

      for (const device of deviceList) {
        // 只处理 Aqara 设备（manufacturerName 包含 'Aqara' 或 'LUMI'）
        const manufacturer = device.manufacturerName || ''
        const modelId = device.modelId || ''
        
        if (manufacturer.includes('Aqara') || 
            manufacturer.includes('LUMI') || 
            modelId.includes('lumi') ||
            modelId.includes('aqara')) {
          
          const friendlyName = device.friendly_name || device.ieeeAddr || device.networkAddress
          const deviceInfo: AqaraDevice = {
            deviceId: friendlyName,
            name: device.definition?.description || device.modelId || friendlyName,
            type: device.type || 'unknown',
            online: device.powerSource !== 'Battery' || device.lastSeen !== undefined,
            ...device,
          }

          this.devices.set(friendlyName, deviceInfo)
        }
      }

      console.log(`Aqara Bridge: Discovered ${this.devices.size} Aqara devices`)
    } catch (error) {
      console.error('Aqara Bridge: Failed to parse device list:', error)
    }
  }

  /**
   * 处理设备状态更新
   */
  private async handleDeviceStatus(deviceId: string, payload: string): Promise<void> {
    try {
      const state = AqaraAdapter.parseStateMessage({
        topic: `${this.zigbee2mqttPrefix}/${deviceId}`,
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
          this.devices.set(deviceId, {
            deviceId,
            name: deviceId,
            type: 'unknown',
            online: true,
          })
        }
      }
    } catch (error) {
      console.error(`Aqara Bridge: Failed to handle device status for ${deviceId}:`, error)
    }
  }

  /**
   * 发送控制命令到设备
   */
  async sendCommand(deviceId: string, command: any): Promise<boolean> {
    try {
      const commandMessage = AqaraAdapter.createCommandMessage(deviceId, command)
      await this.mqttClient.publish(commandMessage)
      return true
    } catch (error) {
      console.error(`Aqara Bridge: Failed to send command to device ${deviceId}:`, error)
      return false
    }
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
  getDevices(): AqaraDevice[] {
    return Array.from(this.devices.values())
  }

  /**
   * 获取特定设备
   */
  getDevice(deviceId: string): AqaraDevice | undefined {
    return this.devices.get(deviceId)
  }
}

// 单例实例
let aqaraBridgeInstance: AqaraMQTTBridge | null = null

/**
 * 获取或创建 Aqara Bridge 实例
 */
export function getAqaraBridge(config?: AqaraBridgeConfig): AqaraMQTTBridge {
  if (!aqaraBridgeInstance && config) {
    aqaraBridgeInstance = new AqaraMQTTBridge(config)
  }
  
  if (!aqaraBridgeInstance) {
    throw new Error('Aqara Bridge not initialized. Please provide config.')
  }
  
  return aqaraBridgeInstance
}
