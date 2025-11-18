// ESP（ESP32/ESP8266）MQTT 適配器
// 處理 ESP 設備的 MQTT 通訊協議

import { MQTTMessage, IoTDevice } from '../mqtt-client'

// ESP 設備狀態介面
export interface ESPDeviceState {
  power?: boolean | number // 電源（0/1 或 true/false）
  state?: string // 狀態字串
  sensor?: {
    temperature?: number
    humidity?: number
    [key: string]: any
  }
  [key: string]: any // 其他屬性
}

// ESP 設備控制命令介面
export interface ESPControlCommand {
  command: string // 命令（如：ON, OFF, SET_TEMP）
  value?: any // 值
}

/**
 * ESP MQTT 適配器類別
 * 處理 ESP32/ESP8266 設備的 MQTT 主題格式和訊息格式
 */
export class ESPAdapter {
  // ESP MQTT 主題格式：esp/{device_id}/status 和 esp/{device_id}/control
  private static readonly TOPIC_PREFIX = 'esp'
  private static readonly STATUS_TOPIC = 'status'
  private static readonly CONTROL_TOPIC = 'control'
  private static readonly SET_TOPIC = 'set'

  // 從設備 ID 生成狀態主題
  static getStatusTopic(deviceId: string): string {
    return `${this.TOPIC_PREFIX}/${deviceId}/${this.STATUS_TOPIC}`
  }

  // 從設備 ID 生成控制主題
  static getControlTopic(deviceId: string): string {
    return `${this.TOPIC_PREFIX}/${deviceId}/${this.CONTROL_TOPIC}`
  }

  // 從設備 ID 生成設定主題
  static getSetTopic(deviceId: string): string {
    return `${this.TOPIC_PREFIX}/${deviceId}/${this.SET_TOPIC}`
  }

  // 從主題解析設備 ID
  static parseDeviceId(topic: string): string | null {
    const parts = topic.split('/')
    if (parts.length >= 2 && parts[0] === this.TOPIC_PREFIX) {
      return parts[1]
    }
    return null
  }

  // 解析 ESP 狀態訊息
  static parseStateMessage(message: MQTTMessage): ESPDeviceState | null {
    try {
      const payload = typeof message.payload === 'string' 
        ? message.payload 
        : message.payload.toString()
      
      // ESP 可能使用 JSON 或簡單字串格式
      try {
        const data = JSON.parse(payload)
        return data as ESPDeviceState
      } catch {
        // 如果不是 JSON，嘗試解析簡單格式
        const state: ESPDeviceState = {}
        
        // 處理簡單的 ON/OFF 格式
        if (payload === 'ON' || payload === '1') {
          state.power = true
        } else if (payload === 'OFF' || payload === '0') {
          state.power = false
        } else {
          state.state = payload
        }
        
        return state
      }
    } catch (error) {
      console.error('ESP: Failed to parse state message', error)
      return null
    }
  }

  // 生成控制命令訊息
  static createCommandMessage(deviceId: string, command: ESPControlCommand): MQTTMessage {
    const topic = this.getSetTopic(deviceId)
    let payload: string

    // ESP 通常使用簡單字串命令
    if (command.command === 'ON' || command.command === 'OFF') {
      payload = command.command
    } else if (command.value !== undefined) {
      payload = JSON.stringify({
        command: command.command,
        value: command.value,
      })
    } else {
      payload = command.command
    }

    return {
      topic,
      payload,
      qos: 1, // ESP 使用 QoS 1
    }
  }

  // 創建 ESP 設備物件
  static createDevice(deviceId: string, name: string, metadata?: Record<string, any>): IoTDevice {
    return {
      id: deviceId,
      name,
      vendor: 'esp',
      topic: this.getStatusTopic(deviceId),
      status: 'offline',
      metadata: {
        statusTopic: this.getStatusTopic(deviceId),
        controlTopic: this.getControlTopic(deviceId),
        setTopic: this.getSetTopic(deviceId),
        ...metadata,
      },
    }
  }

  // 常見 ESP 控制命令
  static commands = {
    powerOn: (deviceId: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { command: 'ON' }),
    
    powerOff: (deviceId: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { command: 'OFF' }),
    
    setTemperature: (deviceId: string, temperature: number): MQTTMessage => 
      this.createCommandMessage(deviceId, { command: 'SET_TEMP', value: temperature }),
    
    setState: (deviceId: string, state: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { command: 'SET_STATE', value: state }),
  }
}

