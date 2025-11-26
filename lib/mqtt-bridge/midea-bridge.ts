// Midea MQTT Bridge
// 将 Midea Cloud API 设备桥接到本地 MQTT Broker
// Bridges Midea Cloud API devices to local MQTT Broker

import { getMQTTClient } from '../mqtt-client'
import { MideaAdapter } from '../mqtt-adapters/midea-adapter'
import { MideaAPIClient } from '../midea-api-client'

interface MideaCloudDevice {
  deviceId: string
  name: string
  type: string
  online: boolean
  [key: string]: any
}

interface MideaBridgeConfig {
  appId: string
  appKey: string
  mqttBrokerUrl: string
  mqttUsername?: string
  mqttPassword?: string
  pollInterval?: number // 轮询间隔（毫秒），默认 5000
}

/**
 * Midea MQTT Bridge
 * 连接 Midea Cloud API 和本地 MQTT Broker
 */
export class MideaMQTTBridge {
  private config: MideaBridgeConfig
  private mqttClient: ReturnType<typeof getMQTTClient>
  private apiClient: MideaAPIClient
  private pollingInterval: NodeJS.Timeout | null = null
  private devices: Map<string, MideaCloudDevice> = new Map()
  private isRunning = false

  constructor(config: MideaBridgeConfig) {
    this.config = {
      pollInterval: 5000,
      ...config,
    }
    this.mqttClient = getMQTTClient({
      brokerUrl: config.mqttBrokerUrl,
      username: config.mqttUsername,
      password: config.mqttPassword,
    })
    this.apiClient = new MideaAPIClient({
      clientId: config.appId,
      clientSecret: config.appKey,
      serverHost: process.env.MIDEA_SERVER_HOST || 'https://obm.midea.com',
    })
  }

  /**
   * 启动桥接服务
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Midea Bridge: Already running')
      return
    }

    console.log('Midea Bridge: Starting...')

    // 连接到 MQTT Broker
    if (!this.mqttClient.isConnected()) {
      await this.mqttClient.connect()
    }

    // 订阅所有 Midea 命令主题
    await this.mqttClient.subscribe('midea/+/command', 1)

    // 设置命令消息处理器
    this.mqttClient.onMessage('midea/+/command', async (message) => {
      await this.handleCommand(message)
    })

    // 开始轮询设备状态
    await this.pollDevices()
    this.startPolling()

    this.isRunning = true
    console.log('Midea Bridge: Started successfully')
  }

  /**
   * 停止桥接服务
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    console.log('Midea Bridge: Stopping...')

    // 停止轮询
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    // 取消订阅
    await this.mqttClient.unsubscribe('midea/+/command')

    // 断开 MQTT 连接
    await this.mqttClient.disconnect()

    this.isRunning = false
    console.log('Midea Bridge: Stopped')
  }

  /**
   * 从 Midea Cloud API 获取设备列表
   */
  private async fetchDevicesFromCloud(): Promise<MideaCloudDevice[]> {
    try {
      const result = await this.apiClient.getDeviceListV5()
      
      if (!result.success || !result.data) {
        console.error('Midea Bridge: Failed to fetch devices:', result.error)
        return []
      }

      // Transform API response to MideaCloudDevice format
      return result.data.map((device: any) => ({
        deviceId: device.deviceId || device.id || '',
        name: device.name || device.deviceName || 'Unknown Device',
        type: device.type || device.deviceType || 'unknown',
        online: device.online !== undefined ? device.online : true,
        ...device,
      }))
    } catch (error) {
      console.error('Midea Bridge: Failed to fetch devices from cloud:', error)
      return []
    }
  }

  /**
   * 从 Midea Cloud API 获取设备状态
   */
  private async fetchDeviceStatus(deviceId: string): Promise<any> {
    try {
      const result = await this.apiClient.getDeviceStatusV5(deviceId)
      
      if (!result.success || !result.data) {
        console.error(`Midea Bridge: Failed to fetch status for device ${deviceId}:`, result.error)
        return null
      }

      return result.data
    } catch (error) {
      console.error(`Midea Bridge: Failed to fetch status for device ${deviceId}:`, error)
      return null
    }
  }

  /**
   * 发送控制命令到 Midea Cloud API
   */
  private async sendCommandToCloud(deviceId: string, command: any): Promise<boolean> {
    try {
      const result = await this.apiClient.controlDeviceV5(deviceId, command)
      
      if (!result.success) {
        console.error(`Midea Bridge: Failed to send command to device ${deviceId}:`, result.error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Midea Bridge: Failed to send command to device ${deviceId}:`, error)
      return false
    }
  }

  /**
   * 轮询设备状态
   */
  private async pollDevices(): Promise<void> {
    try {
      // 获取设备列表
      const devices = await this.fetchDevicesFromCloud()
      
      // 更新设备映射
      devices.forEach(device => {
        this.devices.set(device.deviceId, device)
      })

      // 为每个设备获取状态并发布到 MQTT
      for (const device of devices) {
        if (device.online) {
          const status = await this.fetchDeviceStatus(device.deviceId)
          
          if (status) {
            // 发布状态到 MQTT
            const statusTopic = MideaAdapter.getStatusTopic(device.deviceId)
            await this.mqttClient.publish({
              topic: statusTopic,
              payload: JSON.stringify({
                ...status,
                deviceId: device.deviceId,
                name: device.name,
                timestamp: Date.now(),
              }),
              qos: 1,
            })
          }
        }
      }
    } catch (error) {
      console.error('Midea Bridge: Polling error:', error)
    }
  }

  /**
   * 开始定期轮询
   */
  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }

    this.pollingInterval = setInterval(() => {
      this.pollDevices()
    }, this.config.pollInterval)
  }

  /**
   * 处理来自 MQTT 的命令
   */
  private async handleCommand(message: any): Promise<void> {
    try {
      const deviceId = MideaAdapter.parseDeviceId(message.topic)
      
      if (!deviceId) {
        console.error('Midea Bridge: Cannot parse device ID from topic:', message.topic)
        return
      }

      // 解析命令
      let command: any
      try {
        command = typeof message.payload === 'string'
          ? JSON.parse(message.payload)
          : message.payload
      } catch {
        console.error('Midea Bridge: Invalid command format')
        return
      }

      // 发送命令到 Midea Cloud
      const success = await this.sendCommandToCloud(deviceId, command)

      if (success) {
        console.log(`Midea Bridge: Command sent to device ${deviceId}`)
        
        // 等待一下后刷新设备状态
        setTimeout(() => {
          this.pollDevices()
        }, 1000)
      }
    } catch (error) {
      console.error('Midea Bridge: Error handling command:', error)
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
  getDevices(): MideaCloudDevice[] {
    return Array.from(this.devices.values())
  }
}

// 单例实例
let mideaBridgeInstance: MideaMQTTBridge | null = null

/**
 * 获取或创建 Midea Bridge 实例
 */
export function getMideaBridge(config?: MideaBridgeConfig): MideaMQTTBridge {
  if (!mideaBridgeInstance && config) {
    mideaBridgeInstance = new MideaMQTTBridge(config)
  }
  
  if (!mideaBridgeInstance) {
    throw new Error('Midea Bridge not initialized. Please provide config.')
  }
  
  return mideaBridgeInstance
}

