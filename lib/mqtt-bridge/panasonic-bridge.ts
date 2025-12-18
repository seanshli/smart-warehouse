// Panasonic MQTT Bridge
// 将 Panasonic RESTful API 设备桥接到本地 MQTT Broker
// Bridges Panasonic RESTful API devices to local MQTT Broker

import { getMQTTClient } from '../mqtt-client'
import { PanasonicMQTTAdapter } from '../mqtt-adapters/panasonic-mqtt-adapter'

interface PanasonicCloudDevice {
  deviceId: string
  name: string
  type: string
  online: boolean
  [key: string]: any
}

interface PanasonicBridgeConfig {
  baseUrl: string
  apiKey?: string
  accessToken?: string
  mqttBrokerUrl: string
  mqttUsername?: string
  mqttPassword?: string
  pollInterval?: number // 轮询间隔（毫秒），默认 5000
}

/**
 * Panasonic MQTT Bridge
 * 连接 Panasonic RESTful API 和本地 MQTT Broker
 */
export class PanasonicMQTTBridge {
  private config: PanasonicBridgeConfig
  private mqttClient: ReturnType<typeof getMQTTClient>
  private pollingInterval: NodeJS.Timeout | null = null
  private devices: Map<string, PanasonicCloudDevice> = new Map()
  private isRunning = false

  constructor(config: PanasonicBridgeConfig) {
    this.config = {
      pollInterval: 5000,
      ...config,
    }
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
      console.log('Panasonic Bridge: Already running')
      return
    }

    console.log('Panasonic Bridge: Starting...')

    // 连接到 MQTT Broker
    if (!this.mqttClient.isConnected()) {
      await this.mqttClient.connect()
    }

    // 订阅所有 Panasonic 命令主题
    await this.mqttClient.subscribe('panasonic/+/command', 1)

    // 设置命令消息处理器
    this.mqttClient.onMessage('panasonic/+/command', async (message) => {
      await this.handleCommand(message)
    })

    // 开始轮询设备状态
    await this.pollDevices()
    this.startPolling()

    this.isRunning = true
    console.log('Panasonic Bridge: Started successfully')
  }

  /**
   * 停止桥接服务
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    console.log('Panasonic Bridge: Stopping...')

    // 停止轮询
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    // 取消订阅
    await this.mqttClient.unsubscribe('panasonic/+/command')

    // 断开 MQTT 连接
    await this.mqttClient.disconnect()

    this.isRunning = false
    console.log('Panasonic Bridge: Stopped')
  }

  /**
   * 从 Panasonic Cloud API 获取设备列表
   */
  private async fetchDevicesFromCloud(): Promise<PanasonicCloudDevice[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // 添加认证
      if (this.config.apiKey) {
        headers['X-API-Key'] = this.config.apiKey
      }
      if (this.config.accessToken) {
        headers['Authorization'] = `Bearer ${this.config.accessToken}`
      }

      const url = `${this.config.baseUrl}/devices`
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Transform API response to PanasonicCloudDevice format
      const devices = Array.isArray(data) ? data : (data.devices || [])
      return devices.map((device: any) => ({
        deviceId: device.deviceId || device.id || '',
        name: device.name || device.deviceName || 'Unknown Device',
        type: device.type || device.deviceType || 'unknown',
        online: device.online !== undefined ? device.online : true,
        ...device,
      }))
    } catch (error) {
      console.error('Panasonic Bridge: Failed to fetch devices from cloud:', error)
      return []
    }
  }

  /**
   * 从 Panasonic Cloud API 获取设备状态
   */
  private async fetchDeviceStatus(deviceId: string): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // 添加认证
      if (this.config.apiKey) {
        headers['X-API-Key'] = this.config.apiKey
      }
      if (this.config.accessToken) {
        headers['Authorization'] = `Bearer ${this.config.accessToken}`
      }

      const url = `${this.config.baseUrl}/devices/${deviceId}/status`
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.state || data.parameters || data
    } catch (error) {
      console.error(`Panasonic Bridge: Failed to fetch status for device ${deviceId}:`, error)
      return null
    }
  }

  /**
   * 发送控制命令到 Panasonic Cloud API
   */
  private async sendCommandToCloud(deviceId: string, command: any): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // 添加认证
      if (this.config.apiKey) {
        headers['X-API-Key'] = this.config.apiKey
      }
      if (this.config.accessToken) {
        headers['Authorization'] = `Bearer ${this.config.accessToken}`
      }

      // Remove action field if present
      const { action, ...body } = command

      const url = `${this.config.baseUrl}/devices/${deviceId}/control`
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`)
      }

      return true
    } catch (error) {
      console.error(`Panasonic Bridge: Failed to send command to device ${deviceId}:`, error)
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
            const statusTopic = PanasonicMQTTAdapter.getStatusTopic(device.deviceId)
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
      console.error('Panasonic Bridge: Polling error:', error)
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
      const deviceId = PanasonicMQTTAdapter.parseDeviceId(message.topic)
      
      if (!deviceId) {
        console.error('Panasonic Bridge: Cannot parse device ID from topic:', message.topic)
        return
      }

      // 解析命令
      let command: any
      try {
        command = typeof message.payload === 'string'
          ? JSON.parse(message.payload)
          : message.payload
      } catch {
        console.error('Panasonic Bridge: Invalid command format')
        return
      }

      // 发送命令到 Panasonic Cloud
      const success = await this.sendCommandToCloud(deviceId, command)

      if (success) {
        console.log(`Panasonic Bridge: Command sent to device ${deviceId}`)
        
        // 等待一下后刷新设备状态
        setTimeout(() => {
          this.pollDevices()
        }, 1000)
      }
    } catch (error) {
      console.error('Panasonic Bridge: Error handling command:', error)
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
  getDevices(): PanasonicCloudDevice[] {
    return Array.from(this.devices.values())
  }
}

// 单例实例
let panasonicBridgeInstance: PanasonicMQTTBridge | null = null

/**
 * 获取或创建 Panasonic Bridge 实例
 */
export function getPanasonicBridge(config?: PanasonicBridgeConfig): PanasonicMQTTBridge {
  if (!panasonicBridgeInstance && config) {
    panasonicBridgeInstance = new PanasonicMQTTBridge(config)
  }
  
  if (!panasonicBridgeInstance) {
    throw new Error('Panasonic Bridge not initialized. Please provide config.')
  }
  
  return panasonicBridgeInstance
}
