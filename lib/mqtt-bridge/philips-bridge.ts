// Philips Hue MQTT Bridge
// 将 Philips Hue RESTful API 设备桥接到本地 MQTT Broker
// Bridges Philips Hue RESTful API devices to local MQTT Broker

import { getMQTTClient } from '../mqtt-client'
import { PhilipsMQTTAdapter } from '../mqtt-adapters/philips-mqtt-adapter'
import { PhilipsAdapter } from '../iot-adapters/philips-adapter'

interface PhilipsHueDevice {
  bridgeId: string
  lightId: string
  name: string
  type: string
  reachable: boolean
  [key: string]: any
}

interface PhilipsBridgeConfig {
  bridgeIp: string
  apiKey: string
  mqttBrokerUrl: string
  mqttUsername?: string
  mqttPassword?: string
  pollInterval?: number // 轮询间隔（毫秒），默认 5000
}

/**
 * Philips Hue MQTT Bridge
 * 连接 Philips Hue RESTful API 和本地 MQTT Broker
 */
export class PhilipsMQTTBridge {
  private config: PhilipsBridgeConfig
  private mqttClient: ReturnType<typeof getMQTTClient>
  private pollingInterval: NodeJS.Timeout | null = null
  private devices: Map<string, PhilipsHueDevice> = new Map()
  private isRunning = false
  private baseUrl: string

  constructor(config: PhilipsBridgeConfig) {
    this.config = {
      pollInterval: 5000,
      ...config,
    }
    this.baseUrl = `http://${config.bridgeIp}`
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
      console.log('Philips Bridge: Already running')
      return
    }

    console.log('Philips Bridge: Starting...')

    // 连接到 MQTT Broker
    if (!this.mqttClient.isConnected()) {
      await this.mqttClient.connect()
    }

    // 订阅所有 Philips 命令主题
    await this.mqttClient.subscribe('philips/+/lights/+/command', 1)

    // 设置命令消息处理器
    this.mqttClient.onMessage('philips/+/lights/+/command', async (message) => {
      await this.handleCommand(message)
    })

    // 开始轮询设备状态
    await this.pollDevices()
    this.startPolling()

    this.isRunning = true
    console.log('Philips Bridge: Started successfully')
  }

  /**
   * 停止桥接服务
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    console.log('Philips Bridge: Stopping...')

    // 停止轮询
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    // 取消订阅
    await this.mqttClient.unsubscribe('philips/+/lights/+/command')

    // 断开 MQTT 连接
    await this.mqttClient.disconnect()

    this.isRunning = false
    console.log('Philips Bridge: Stopped')
  }

  /**
   * 从 Philips Hue Bridge RESTful API 获取设备列表
   */
  private async fetchDevicesFromBridge(): Promise<PhilipsHueDevice[]> {
    try {
      const url = `${this.baseUrl}/api/${this.config.apiKey}/lights`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const devices: PhilipsHueDevice[] = []

      // Transform API response to PhilipsHueDevice format
      for (const [lightId, lightData] of Object.entries(data)) {
        const light = lightData as any
        devices.push({
          bridgeId: this.config.bridgeIp,
          lightId,
          name: light.name || `Light ${lightId}`,
          type: light.type || 'unknown',
          reachable: light.state?.reachable !== false,
          ...light,
        })
      }

      return devices
    } catch (error) {
      console.error('Philips Bridge: Failed to fetch devices from bridge:', error)
      return []
    }
  }

  /**
   * 从 Philips Hue Bridge RESTful API 获取设备状态
   */
  private async fetchDeviceStatus(lightId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/${this.config.apiKey}/lights/${lightId}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.state || data
    } catch (error) {
      console.error(`Philips Bridge: Failed to fetch status for light ${lightId}:`, error)
      return null
    }
  }

  /**
   * 发送控制命令到 Philips Hue Bridge RESTful API
   */
  private async sendCommandToBridge(lightId: string, command: any): Promise<boolean> {
    try {
      // Remove action field if present
      const { action, ...body } = command

      const url = `${this.baseUrl}/api/${this.config.apiKey}/lights/${lightId}/state`
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`)
      }

      return true
    } catch (error) {
      console.error(`Philips Bridge: Failed to send command to light ${lightId}:`, error)
      return false
    }
  }

  /**
   * 轮询设备状态
   */
  private async pollDevices(): Promise<void> {
    try {
      // 获取设备列表
      const devices = await this.fetchDevicesFromBridge()
      
      // 更新设备映射
      devices.forEach(device => {
        const deviceKey = `${device.bridgeId}_${device.lightId}`
        this.devices.set(deviceKey, device)
      })

      // 为每个设备获取状态并发布到 MQTT
      for (const device of devices) {
        if (device.reachable) {
          const status = await this.fetchDeviceStatus(device.lightId)
          
          if (status) {
            // 发布状态到 MQTT
            const stateTopic = PhilipsMQTTAdapter.getStateTopic(device.bridgeId, device.lightId)
            await this.mqttClient.publish({
              topic: stateTopic,
              payload: JSON.stringify({
                ...status,
                bridgeId: device.bridgeId,
                lightId: device.lightId,
                name: device.name,
                timestamp: Date.now(),
              }),
              qos: 1,
            })
          }
        }
      }
    } catch (error) {
      console.error('Philips Bridge: Polling error:', error)
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
      const parsed = PhilipsMQTTAdapter.parseDeviceId(message.topic)
      
      if (!parsed.bridgeId || !parsed.lightId) {
        console.error('Philips Bridge: Cannot parse bridge/light ID from topic:', message.topic)
        return
      }

      // 解析命令
      let command: any
      try {
        command = typeof message.payload === 'string'
          ? JSON.parse(message.payload)
          : message.payload
      } catch {
        console.error('Philips Bridge: Invalid command format')
        return
      }

      // 发送命令到 Philips Hue Bridge
      const success = await this.sendCommandToBridge(parsed.lightId, command)

      if (success) {
        console.log(`Philips Bridge: Command sent to light ${parsed.lightId}`)
        
        // 等待一下后刷新设备状态
        setTimeout(() => {
          this.pollDevices()
        }, 1000)
      }
    } catch (error) {
      console.error('Philips Bridge: Error handling command:', error)
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
  getDevices(): PhilipsHueDevice[] {
    return Array.from(this.devices.values())
  }
}

// 单例实例
let philipsBridgeInstance: PhilipsMQTTBridge | null = null

/**
 * 获取或创建 Philips Bridge 实例
 */
export function getPhilipsBridge(config?: PhilipsBridgeConfig): PhilipsMQTTBridge {
  if (!philipsBridgeInstance && config) {
    philipsBridgeInstance = new PhilipsMQTTBridge(config)
  }
  
  if (!philipsBridgeInstance) {
    throw new Error('Philips Bridge not initialized. Please provide config.')
  }
  
  return philipsBridgeInstance
}
