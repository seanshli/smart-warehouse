// Midea（美的）MQTT 適配器
// 處理 Midea 設備的 MQTT 通訊協議

import { MQTTMessage, IoTDevice } from '../mqtt-client'

// Midea 設備狀態介面
export interface MideaDeviceState {
  power?: boolean // 電源
  mode?: string // 模式（製冷、制熱、除濕等）
  targetTemp?: number // 目標溫度
  currentTemp?: number // 當前溫度
  fanSpeed?: number | string // 風速
  swing?: boolean // 擺風
  [key: string]: any // 其他屬性
}

// Midea 設備控制命令介面
export interface MideaControlCommand {
  cmd: string // 命令類型
  data?: Record<string, any> // 命令資料
}

/**
 * Midea MQTT 適配器類別
 * 處理 Midea 設備的 MQTT 主題格式和訊息格式
 */
export class MideaAdapter {
  // Midea MQTT 主題格式：midea/{device_id}/command 和 midea/{device_id}/status
  private static readonly TOPIC_PREFIX = 'midea'
  private static readonly COMMAND_TOPIC = 'command'
  private static readonly STATUS_TOPIC = 'status'

  // 從設備 ID 生成命令主題
  static getCommandTopic(deviceId: string): string {
    return `${this.TOPIC_PREFIX}/${deviceId}/${this.COMMAND_TOPIC}`
  }

  // 從設備 ID 生成狀態主題
  static getStatusTopic(deviceId: string): string {
    return `${this.TOPIC_PREFIX}/${deviceId}/${this.STATUS_TOPIC}`
  }

  // 從主題解析設備 ID
  static parseDeviceId(topic: string): string | null {
    const parts = topic.split('/')
    if (parts.length >= 2 && parts[0] === this.TOPIC_PREFIX) {
      return parts[1]
    }
    return null
  }

  // 解析 Midea 狀態訊息
  static parseStateMessage(message: MQTTMessage): MideaDeviceState | null {
    try {
      const payload = typeof message.payload === 'string' 
        ? message.payload 
        : message.payload.toString()
      
      const data = JSON.parse(payload)
      return data as MideaDeviceState
    } catch (error) {
      console.error('Midea: Failed to parse state message', error)
      return null
    }
  }

  // 生成控制命令訊息
  static createCommandMessage(deviceId: string, command: MideaControlCommand): MQTTMessage {
    const topic = this.getCommandTopic(deviceId)
    const payload = JSON.stringify({
      cmd: command.cmd,
      data: command.data || {},
      timestamp: Date.now(),
    })

    return {
      topic,
      payload,
      qos: 1, // Midea 使用 QoS 1
    }
  }

  // 創建 Midea 設備物件
  static createDevice(deviceId: string, name: string, metadata?: Record<string, any>): IoTDevice {
    return {
      id: deviceId,
      name,
      vendor: 'midea',
      topic: this.getStatusTopic(deviceId),
      status: 'offline',
      metadata: {
        commandTopic: this.getCommandTopic(deviceId),
        statusTopic: this.getStatusTopic(deviceId),
        ...metadata,
      },
    }
  }

  // 常見 Midea 控制命令
  static commands = {
    powerOn: (deviceId: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { cmd: 'power', data: { power: true } }),
    
    powerOff: (deviceId: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { cmd: 'power', data: { power: false } }),
    
    setTemperature: (deviceId: string, temperature: number): MQTTMessage => 
      this.createCommandMessage(deviceId, { cmd: 'set_temp', data: { temp: temperature } }),
    
    setMode: (deviceId: string, mode: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { cmd: 'set_mode', data: { mode } }),
    
    setFanSpeed: (deviceId: string, speed: number | string): MQTTMessage => 
      this.createCommandMessage(deviceId, { cmd: 'set_fan', data: { speed } }),
    
    setSwing: (deviceId: string, swing: boolean): MQTTMessage => 
      this.createCommandMessage(deviceId, { cmd: 'set_swing', data: { swing } }),
  }
}

