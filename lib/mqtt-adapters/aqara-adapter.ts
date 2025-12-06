// Aqara MQTT 適配器
// 處理 Aqara 設備的 MQTT 通訊協議（通過 Zigbee2MQTT）

import { MQTTMessage, IoTDevice } from '../mqtt-client'

// Aqara 設備狀態介面
export interface AqaraDeviceState {
  // 開關狀態
  state?: 'ON' | 'OFF' | string // 開關狀態
  contact?: boolean // 門窗感測器（true=關閉, false=打開）
  occupancy?: boolean // 動作感測器（true=有動作）
  water_leak?: boolean // 水浸感測器（true=有水）
  vibration?: boolean // 震動感測器（true=震動）
  
  // 感測器數值
  temperature?: number // 溫度（攝氏度）
  humidity?: number // 濕度（百分比）
  pressure?: number // 氣壓
  
  // 燈光控制
  brightness?: number // 亮度（0-255）
  color?: {
    r?: number
    g?: number
    b?: number
  }
  color_temp?: number // 色溫
  
  // 窗簾控制
  position?: number // 位置（0-100）
  
  // 電池和連接
  battery?: number // 電池電量（百分比）
  voltage?: number // 電壓（毫伏）
  linkquality?: number // 連接品質（0-255）
  
  // 開關動作
  click?: string // 單擊/雙擊/長按
  action?: string // 動作（旋轉/翻轉/敲擊）
  
  [key: string]: any // 其他屬性
}

// Aqara 設備控制命令介面
export interface AqaraControlCommand {
  action: string // 操作類型
  value?: any // 值
  state?: 'ON' | 'OFF' | 'TOGGLE' // 開關狀態
  brightness?: number // 亮度
  color?: { r: number; g: number; b: number } // 顏色
  color_temp?: number // 色溫
  position?: number // 位置
}

/**
 * Aqara MQTT 適配器類別
 * 處理 Aqara 設備的 MQTT 主題格式和訊息格式（通過 Zigbee2MQTT）
 */
export class AqaraAdapter {
  // Zigbee2MQTT 主題格式：zigbee2mqtt/<device_friendly_name>
  private static readonly TOPIC_PREFIX = 'zigbee2mqtt'
  private static readonly SET_SUFFIX = 'set'

  /**
   * 從設備友好名稱生成狀態主題
   */
  static getStatusTopic(deviceId: string): string {
    return `${this.TOPIC_PREFIX}/${deviceId}`
  }

  /**
   * 從設備友好名稱生成命令主題
   */
  static getCommandTopic(deviceId: string): string {
    return `${this.TOPIC_PREFIX}/${deviceId}/${this.SET_SUFFIX}`
  }

  /**
   * 從主題解析設備 ID
   */
  static parseDeviceId(topic: string): string | null {
    // 格式：zigbee2mqtt/<device_name> 或 zigbee2mqtt/<device_name>/set
    if (topic.startsWith(this.TOPIC_PREFIX + '/')) {
      const parts = topic.split('/')
      if (parts.length >= 2) {
        return parts[1] // 返回設備友好名稱
      }
    }
    return null
  }

  /**
   * 解析 Aqara 狀態訊息
   */
  static parseStateMessage(message: MQTTMessage): AqaraDeviceState | null {
    try {
      const payload = typeof message.payload === 'string' 
        ? message.payload 
        : message.payload.toString()
      
      // Zigbee2MQTT 使用 JSON 格式
      const data = JSON.parse(payload)
      
      const state: AqaraDeviceState = {
        // 開關狀態
        state: data.state,
        contact: data.contact,
        occupancy: data.occupancy,
        water_leak: data.water_leak,
        vibration: data.vibration,
        
        // 感測器數值
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        
        // 燈光控制
        brightness: data.brightness,
        color: data.color,
        color_temp: data.color_temp,
        
        // 窗簾控制
        position: data.position,
        
        // 電池和連接
        battery: data.battery,
        voltage: data.voltage,
        linkquality: data.linkquality,
        
        // 開關動作
        click: data.click,
        action: data.action,
        
        // 保留所有原始數據
        ...data,
      }
      
      return state
    } catch (error) {
      console.error('Aqara: Failed to parse state message', error)
      return null
    }
  }

  /**
   * 生成控制命令訊息
   */
  static createCommandMessage(
    deviceId: string, 
    command: AqaraControlCommand
  ): MQTTMessage {
    const topic = this.getCommandTopic(deviceId)
    const payload: any = {}

    // 根據操作類型構建命令
    if (command.action === 'power_on' || command.state === 'ON') {
      payload.state = 'ON'
    } else if (command.action === 'power_off' || command.state === 'OFF') {
      payload.state = 'OFF'
    } else if (command.action === 'toggle' || command.state === 'TOGGLE') {
      payload.state = 'TOGGLE'
    } else if (command.action === 'set_brightness' && command.brightness !== undefined) {
      payload.brightness = command.brightness
    } else if (command.action === 'set_color' && command.color) {
      payload.color = command.color
    } else if (command.action === 'set_color_temp' && command.color_temp !== undefined) {
      payload.color_temp = command.color_temp
    } else if (command.action === 'set_position' && command.position !== undefined) {
      payload.position = command.position
    } else {
      // 通用命令：直接使用提供的值
      if (command.value !== undefined) {
        Object.assign(payload, command.value)
      }
    }

    return {
      topic,
      payload: JSON.stringify(payload),
      qos: 1, // Zigbee2MQTT 使用 QoS 1
    }
  }

  /**
   * 創建 Aqara 設備物件
   */
  static createDevice(
    deviceId: string, 
    name: string, 
    metadata?: Record<string, any>
  ): IoTDevice {
    const statusTopic = this.getStatusTopic(deviceId)
    const commandTopic = this.getCommandTopic(deviceId)

    return {
      id: deviceId,
      name,
      vendor: 'aqara',
      topic: statusTopic,
      status: 'offline',
      metadata: {
        commandTopic,
        statusTopic,
        bridge: 'zigbee2mqtt', // 標記使用 Zigbee2MQTT 橋接
        ...metadata,
      },
    }
  }

  /**
   * 常見 Aqara 控制命令
   */
  static commands = {
    powerOn: (deviceId: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'power_on' }),
    
    powerOff: (deviceId: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'power_off' }),
    
    toggle: (deviceId: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'toggle' }),
    
    setBrightness: (deviceId: string, brightness: number): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_brightness', brightness }),
    
    setColor: (deviceId: string, r: number, g: number, b: number): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_color', color: { r, g, b } }),
    
    setColorTemp: (deviceId: string, colorTemp: number): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_color_temp', color_temp: colorTemp }),
    
    setPosition: (deviceId: string, position: number): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_position', position }),
  }
}

