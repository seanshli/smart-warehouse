// MQTT 客戶端模組
// 提供與 MQTT Broker 連接的功能，支援多種 IoT 設備供應商（Tuya、ESP、Midea）

import mqtt, { MqttClient, IClientOptions, ISubscriptionGrant } from 'mqtt'

// MQTT 連接配置介面
export interface MQTTConfig {
  brokerUrl: string // MQTT Broker URL（例如：mqtt://localhost:1883 或 mqtts://broker.example.com:8883）
  username?: string // 用戶名（可選）
  password?: string // 密碼（可選）
  clientId?: string // 客戶端 ID（可選，預設自動生成）
  keepalive?: number // 保持連接時間（秒，預設 60）
  reconnectPeriod?: number // 重連間隔（毫秒，預設 1000）
  connectTimeout?: number // 連接超時（毫秒，預設 30000）
}

// MQTT 訊息介面
export interface MQTTMessage {
  topic: string // 主題
  payload: string | Buffer // 訊息內容
  qos?: 0 | 1 | 2 // 服務品質等級
  retain?: boolean // 是否保留訊息
}

// 設備供應商類型
export type DeviceVendor = 'tuya' | 'esp' | 'midea' | 'generic'

// 設備資訊介面
export interface IoTDevice {
  id: string // 設備 ID
  name: string // 設備名稱
  vendor: DeviceVendor // 供應商
  topic: string // MQTT 主題
  status: 'online' | 'offline' // 連接狀態
  lastSeen?: Date // 最後在線時間
  metadata?: Record<string, any> // 額外元資料
}

// MQTT 客戶端類別
export class MQTTClient {
  private client: MqttClient | null = null
  private config: MQTTConfig
  private connected: boolean = false
  private devices: Map<string, IoTDevice> = new Map()
  private messageHandlers: Map<string, (message: MQTTMessage) => void> = new Map()
  private connectionCallbacks: {
    onConnect?: () => void
    onDisconnect?: () => void
    onError?: (error: Error) => void
  } = {}

  constructor(config: MQTTConfig) {
    this.config = config
  }

  // 連接到 MQTT Broker
  async connect(): Promise<void> {
    if (this.client?.connected) {
      console.log('MQTT: Already connected')
      return
    }

    return new Promise((resolve, reject) => {
      const options: IClientOptions = {
        clientId: this.config.clientId || `smart-warehouse-${Date.now()}`,
        username: this.config.username,
        password: this.config.password,
        keepalive: this.config.keepalive || 60,
        reconnectPeriod: this.config.reconnectPeriod || 1000,
        connectTimeout: this.config.connectTimeout || 30000,
        clean: true, // 清理會話
      }

      console.log('MQTT: Connecting to', this.config.brokerUrl)
      this.client = mqtt.connect(this.config.brokerUrl, options)

      this.client.on('connect', () => {
        console.log('MQTT: Connected successfully')
        this.connected = true
        this.connectionCallbacks.onConnect?.()
        resolve()
      })

      this.client.on('error', (error) => {
        console.error('MQTT: Connection error', error)
        this.connected = false
        this.connectionCallbacks.onError?.(error)
        reject(error)
      })

      this.client.on('close', () => {
        console.log('MQTT: Connection closed')
        this.connected = false
        this.connectionCallbacks.onDisconnect?.()
      })

      this.client.on('reconnect', () => {
        console.log('MQTT: Reconnecting...')
      })

      this.client.on('message', (topic, payload, packet) => {
        const message: MQTTMessage = {
          topic,
          payload: payload.toString(),
          qos: packet.qos as 0 | 1 | 2,
          retain: packet.retain,
        }

        // 調用主題特定的處理器
        this.messageHandlers.forEach((handler, pattern) => {
          if (this.matchTopic(pattern, topic)) {
            handler(message)
          }
        })

        // 調用通用處理器
        const generalHandler = this.messageHandlers.get('*')
        if (generalHandler) {
          generalHandler(message)
        }
      })
    })
  }

  // 斷開連接
  async disconnect(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client?.end(false, {}, () => {
          console.log('MQTT: Disconnected')
          this.connected = false
          this.client = null
          resolve()
        })
      })
    }
  }

  // 訂閱主題
  async subscribe(topic: string | string[], qos: 0 | 1 | 2 = 0): Promise<ISubscriptionGrant[]> {
    if (!this.client?.connected) {
      throw new Error('MQTT client is not connected')
    }

    return new Promise((resolve, reject) => {
      this.client?.subscribe(topic, { qos }, (error, granted) => {
        if (error) {
          console.error('MQTT: Subscribe error', error)
          reject(error)
        } else {
          console.log('MQTT: Subscribed to', topic, granted)
          resolve(granted)
        }
      })
    })
  }

  // 取消訂閱
  async unsubscribe(topic: string | string[]): Promise<void> {
    if (!this.client?.connected) {
      throw new Error('MQTT client is not connected')
    }

    return new Promise((resolve, reject) => {
      this.client?.unsubscribe(topic, (error) => {
        if (error) {
          console.error('MQTT: Unsubscribe error', error)
          reject(error)
        } else {
          console.log('MQTT: Unsubscribed from', topic)
          resolve()
        }
      })
    })
  }

  // 發布訊息
  async publish(message: MQTTMessage): Promise<void> {
    if (!this.client?.connected) {
      throw new Error('MQTT client is not connected')
    }

    return new Promise((resolve, reject) => {
      this.client?.publish(
        message.topic,
        message.payload,
        {
          qos: message.qos || 0,
          retain: message.retain || false,
        },
        (error) => {
          if (error) {
            console.error('MQTT: Publish error', error)
            reject(error)
          } else {
            console.log('MQTT: Published to', message.topic)
            resolve()
          }
        }
      )
    })
  }

  // 註冊訊息處理器
  onMessage(topic: string, handler: (message: MQTTMessage) => void): void {
    this.messageHandlers.set(topic, handler)
  }

  // 移除訊息處理器
  offMessage(topic: string): void {
    this.messageHandlers.delete(topic)
  }

  // 註冊連接事件回調
  onConnect(callback: () => void): void {
    this.connectionCallbacks.onConnect = callback
  }

  onDisconnect(callback: () => void): void {
    this.connectionCallbacks.onDisconnect = callback
  }

  onError(callback: (error: Error) => void): void {
    this.connectionCallbacks.onError = callback
  }

  // 檢查主題是否匹配（支援通配符）
  private matchTopic(pattern: string, topic: string): boolean {
    if (pattern === '*' || pattern === topic) {
      return true
    }

    // 支援單層通配符 +
    const patternParts = pattern.split('/')
    const topicParts = topic.split('/')

    if (patternParts.length !== topicParts.length) {
      return false
    }

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] !== '+' && patternParts[i] !== topicParts[i]) {
        return false
      }
    }

    return true
  }

  // 獲取連接狀態
  isConnected(): boolean {
    return this.connected && this.client?.connected === true
  }

  // 獲取所有設備
  getDevices(): IoTDevice[] {
    return Array.from(this.devices.values())
  }

  // 添加設備
  addDevice(device: IoTDevice): void {
    this.devices.set(device.id, device)
  }

  // 移除設備
  removeDevice(deviceId: string): void {
    this.devices.delete(deviceId)
  }

  // 更新設備狀態
  updateDeviceStatus(deviceId: string, status: 'online' | 'offline'): void {
    const device = this.devices.get(deviceId)
    if (device) {
      device.status = status
      device.lastSeen = new Date()
      this.devices.set(deviceId, device)
    }
  }
}

// 創建單例 MQTT 客戶端實例
let mqttClientInstance: MQTTClient | null = null

// 獲取或創建 MQTT 客戶端實例
export function getMQTTClient(config?: MQTTConfig): MQTTClient {
  if (!mqttClientInstance) {
    if (!config) {
      // 從環境變數讀取配置
      // 自動區分開發和生產環境
      // Automatically distinguish between development and production environments
      const isProduction = process.env.NODE_ENV === 'production'
      const defaultBrokerUrl = isProduction 
        ? 'mqtts://localhost:8883' // 生產環境預設使用安全連接
        : 'mqtt://localhost:1883'  // 開發環境預設使用本地連接
      
      config = {
        brokerUrl: process.env.MQTT_BROKER_URL || defaultBrokerUrl,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        clientId: process.env.MQTT_CLIENT_ID || (isProduction ? 'smart-warehouse-production' : 'smart-warehouse-dev'),
        keepalive: parseInt(process.env.MQTT_KEEPALIVE || '60'),
        reconnectPeriod: parseInt(process.env.MQTT_RECONNECT_PERIOD || '1000'),
        connectTimeout: parseInt(process.env.MQTT_CONNECT_TIMEOUT || '30000'),
      }
      
      console.log(`MQTT: Using ${isProduction ? 'production' : 'development'} configuration`)
      console.log(`MQTT: Broker URL: ${config.brokerUrl}`)
    }
    mqttClientInstance = new MQTTClient(config)
  }
  return mqttClientInstance
}

