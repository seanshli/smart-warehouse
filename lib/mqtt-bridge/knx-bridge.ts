// KNX MQTT Bridge Service
// 管理通过 KNX2MQTT 网关连接的 KNX 设备
// Manages KNX devices connected via KNX2MQTT gateway

import { getMQTTClient } from '../mqtt-client'
import { KNXAdapter } from '../mqtt-adapters/knx-adapter'

interface KNXDevice {
  groupAddress: string // KNX group address (e.g., "1/2/3" or "1.2.3")
  name: string
  type: string
  dpt?: string // Data Point Type
  online: boolean
  [key: string]: any
}

interface KNXBridgeConfig {
  mqttBrokerUrl: string
  mqttUsername?: string
  mqttPassword?: string
  knxPrefix?: string // Default: 'knx'
  pollInterval?: number // Polling interval for device discovery (milliseconds), default 10000
}

/**
 * KNX MQTT Bridge Service
 * 管理通过 KNX2MQTT 网关连接的 KNX 设备
 * KNX devices connect to MQTT broker via KNX2MQTT gateway
 * This bridge service manages device discovery and monitoring
 */
export class KNXMQTTBridge {
  private config: KNXBridgeConfig
  private mqttClient: ReturnType<typeof getMQTTClient>
  private devices: Map<string, KNXDevice> = new Map()
  private isRunning = false
  private knxPrefix: string
  private pollingInterval: NodeJS.Timeout | null = null

  constructor(config: KNXBridgeConfig) {
    this.config = {
      knxPrefix: 'knx',
      pollInterval: 10000, // 10 seconds for device discovery
      ...config,
    }
    this.knxPrefix = this.config.knxPrefix!
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
      console.log('KNX Bridge: Already running')
      return
    }

    console.log('KNX Bridge: Starting...')

    // 连接到 MQTT Broker
    if (!this.mqttClient.isConnected()) {
      await this.mqttClient.connect()
    }

    // 订阅所有 KNX 设备状态主题
    await this.mqttClient.subscribe(`${this.knxPrefix}/+`, 1)
    await this.mqttClient.subscribe(`${this.knxPrefix}/+/+`, 1)
    await this.mqttClient.subscribe(`${this.knxPrefix}/+/+/+`, 1)

    // 订阅 KNX2MQTT bridge 状态（设备列表）
    await this.mqttClient.subscribe(`${this.knxPrefix}/bridge/status`, 1)
    await this.mqttClient.subscribe(`${this.knxPrefix}/bridge/devices`, 1)

    // 设置消息处理器
    this.mqttClient.onMessage(`${this.knxPrefix}/+`, async (message) => {
      await this.handleMessage(message)
    })

    // 请求设备列表
    await this.requestDeviceList()

    this.isRunning = true
    console.log('KNX Bridge: Started successfully')
  }

  /**
   * 停止桥接服务
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    console.log('KNX Bridge: Stopping...')

    // 停止轮询
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    // 取消订阅
    await this.mqttClient.unsubscribe(`${this.knxPrefix}/+`)
    await this.mqttClient.unsubscribe(`${this.knxPrefix}/+/+`)
    await this.mqttClient.unsubscribe(`${this.knxPrefix}/+/+/+`)
    await this.mqttClient.unsubscribe(`${this.knxPrefix}/bridge/status`)
    await this.mqttClient.unsubscribe(`${this.knxPrefix}/bridge/devices`)

    // 断开 MQTT 连接
    await this.mqttClient.disconnect()

    this.isRunning = false
    console.log('KNX Bridge: Stopped')
  }

  /**
   * 请求 KNX2MQTT 设备列表
   */
  private async requestDeviceList(): Promise<void> {
    try {
      // Request device list from KNX2MQTT bridge
      // Some KNX2MQTT implementations use different topics
      await this.mqttClient.publish({
        topic: `${this.knxPrefix}/bridge/config/devices/get`,
        payload: '',
        qos: 0,
      })
    } catch (error) {
      console.error('KNX Bridge: Failed to request device list:', error)
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
      if (topic === `${this.knxPrefix}/bridge/config/devices` || 
          topic === `${this.knxPrefix}/bridge/devices`) {
        await this.handleDeviceList(payload)
        return
      }

      // 处理设备状态更新（排除 set 主题）
      if (topic.startsWith(`${this.knxPrefix}/`) && 
          !topic.includes('/bridge/') && 
          !topic.includes('/set')) {
        const groupAddress = KNXAdapter.parseGroupAddress(topic)
        if (groupAddress) {
          await this.handleDeviceStatus(groupAddress, payload)
        }
      }
    } catch (error) {
      console.error('KNX Bridge: Error handling message:', error)
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
        const groupAddress = device.groupAddress || device.GA || device.address
        
        if (groupAddress) {
          const deviceInfo: KNXDevice = {
            groupAddress: typeof groupAddress === 'string' 
              ? groupAddress.replace(/\./g, '/') 
              : String(groupAddress).replace(/\./g, '/'),
            name: device.name || device.friendly_name || `KNX ${groupAddress}`,
            type: device.type || device.dpt || 'unknown',
            dpt: device.dpt || device.DPT,
            online: true,
            ...device,
          }

          this.devices.set(deviceInfo.groupAddress, deviceInfo)
        }
      }

      console.log(`KNX Bridge: Discovered ${this.devices.size} KNX devices`)
    } catch (error) {
      console.error('KNX Bridge: Failed to parse device list:', error)
    }
  }

  /**
   * 处理设备状态更新
   */
  private async handleDeviceStatus(groupAddress: string, payload: string): Promise<void> {
    try {
      const state = KNXAdapter.parseStateMessage({
        topic: `${this.knxPrefix}/${groupAddress}`,
        payload,
      })

      if (state) {
        // 更新设备状态
        const device = this.devices.get(groupAddress)
        if (device) {
          device.online = true
          this.devices.set(groupAddress, device)
        } else {
          // 新设备，添加到列表
          this.devices.set(groupAddress, {
            groupAddress,
            name: `KNX ${groupAddress}`,
            type: state.dpt || 'unknown',
            dpt: state.dpt,
            online: true,
          })
          console.log(`KNX Bridge: Discovered new device ${groupAddress} from status message`)
        }
      }
    } catch (error) {
      console.error(`KNX Bridge: Failed to handle device status for ${groupAddress}:`, error)
    }
  }

  /**
   * 发送控制命令到设备
   */
  async sendCommand(groupAddress: string, command: any): Promise<boolean> {
    try {
      const commandMessage = KNXAdapter.createCommandMessage(groupAddress, command)
      await this.mqttClient.publish(commandMessage)
      return true
    } catch (error) {
      console.error(`KNX Bridge: Failed to send command to device ${groupAddress}:`, error)
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
  getDevices(): KNXDevice[] {
    return Array.from(this.devices.values())
  }

  /**
   * 获取特定设备
   */
  getDevice(groupAddress: string): KNXDevice | undefined {
    return this.devices.get(groupAddress)
  }
}

// 单例实例
let knxBridgeInstance: KNXMQTTBridge | null = null

/**
 * 获取或创建 KNX Bridge 实例
 */
export function getKNXBridge(config?: KNXBridgeConfig): KNXMQTTBridge {
  if (!knxBridgeInstance && config) {
    knxBridgeInstance = new KNXMQTTBridge(config)
  }
  
  if (!knxBridgeInstance) {
    throw new Error('KNX Bridge not initialized. Please provide config.')
  }
  
  return knxBridgeInstance
}
