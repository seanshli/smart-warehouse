// Tuya（塗鴉智能）MQTT 適配器
// 處理 Tuya 設備的 MQTT 通訊協議

import { MQTTMessage, IoTDevice } from '../mqtt-client'

// Tuya 設備狀態介面
export interface TuyaDeviceState {
  power?: boolean // 電源開關
  mode?: string // 模式（如：冷氣模式、除濕模式等）
  temperature?: number // 溫度
  humidity?: number // 濕度
  fanSpeed?: number | string // 風速
  [key: string]: any // 其他屬性
}

// Tuya 設備控制命令介面
export interface TuyaControlCommand {
  action: string // 操作（如：power_on, power_off, set_temperature）
  value?: any // 值
}

/**
 * Tuya MQTT 適配器類別
 * 處理 Tuya 設備的 MQTT 主題格式和訊息格式
 */
export class TuyaAdapter {
  // Tuya MQTT 主題格式：tuya/{device_id}/command 和 tuya/{device_id}/state
  private static readonly TOPIC_PREFIX = 'tuya'
  private static readonly COMMAND_TOPIC = 'command'
  private static readonly STATE_TOPIC = 'state'

  // 從設備 ID 生成命令主題
  static getCommandTopic(deviceId: string): string {
    return `${this.TOPIC_PREFIX}/${deviceId}/${this.COMMAND_TOPIC}`
  }

  // 從設備 ID 生成狀態主題
  static getStateTopic(deviceId: string): string {
    return `${this.TOPIC_PREFIX}/${deviceId}/${this.STATE_TOPIC}`
  }

  // 從主題解析設備 ID
  static parseDeviceId(topic: string): string | null {
    const parts = topic.split('/')
    if (parts.length >= 2 && parts[0] === this.TOPIC_PREFIX) {
      return parts[1]
    }
    return null
  }

  // 解析 Tuya 狀態訊息
  static parseStateMessage(message: MQTTMessage): TuyaDeviceState | null {
    try {
      const payload = typeof message.payload === 'string' 
        ? message.payload 
        : message.payload.toString()
      
      const data = JSON.parse(payload)
      return data as TuyaDeviceState
    } catch (error) {
      console.error('Tuya: Failed to parse state message', error)
      return null
    }
  }

  // 生成控制命令訊息
  static createCommandMessage(deviceId: string, command: TuyaControlCommand): MQTTMessage {
    const topic = this.getCommandTopic(deviceId)
    const payload = JSON.stringify({
      action: command.action,
      value: command.value,
      timestamp: Date.now(),
    })

    return {
      topic,
      payload,
      qos: 1, // Tuya 使用 QoS 1 確保訊息送達
    }
  }

  // 創建 Tuya 設備物件
  static createDevice(deviceId: string, name: string, metadata?: Record<string, any>): IoTDevice {
    return {
      id: deviceId,
      name,
      vendor: 'tuya',
      topic: this.getStateTopic(deviceId),
      status: 'offline',
      metadata: {
        commandTopic: this.getCommandTopic(deviceId),
        stateTopic: this.getStateTopic(deviceId),
        ...metadata,
      },
    }
  }

  // 常見 Tuya 控制命令
  static commands = {
    powerOn: (deviceId: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'power_on' }),
    
    powerOff: (deviceId: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'power_off' }),
    
    setTemperature: (deviceId: string, temperature: number): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_temperature', value: temperature }),
    
    setMode: (deviceId: string, mode: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_mode', value: mode }),
    
    setFanSpeed: (deviceId: string, speed: number | string): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_fan_speed', value: speed }),
  }
}

