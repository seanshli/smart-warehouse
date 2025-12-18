// Panasonic MQTT 適配器
// 處理 Panasonic 設備的 MQTT 通訊協議（通過 MQTT Bridge）
// Panasonic MQTT Adapter - handles Panasonic devices via MQTT Bridge

import { MQTTMessage, IoTDevice } from '../mqtt-client'

// Panasonic 設備狀態介面
export interface PanasonicMQTTDeviceState {
  power?: boolean // 電源
  mode?: string // 模式（冷氣、暖氣、除濕等）
  temperature?: number // 當前溫度
  targetTemperature?: number // 目標溫度
  fanSpeed?: number | string // 風速
  swing?: boolean // 擺風
  eco?: boolean // 節能模式
  online?: boolean // 設備是否在線
  [key: string]: any // 其他屬性
}

// Panasonic 控制命令介面
export interface PanasonicMQTTControlCommand {
  action: string // 操作類型
  power?: boolean | string // 電源（on/off 或 true/false）
  mode?: string // 模式
  temperature?: number // 溫度
  fanSpeed?: number | string // 風速
  swing?: boolean | string // 擺風
  eco?: boolean // 節能模式
  value?: any // 通用值
}

/**
 * Panasonic MQTT 適配器類別
 * 處理 Panasonic 設備的 MQTT 主題格式和訊息格式
 */
export class PanasonicMQTTAdapter {
  // Panasonic MQTT 主題格式：panasonic/{device_id}/command 和 panasonic/{device_id}/status
  private static readonly TOPIC_PREFIX = 'panasonic'
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

  // 解析 Panasonic 狀態訊息
  static parseStateMessage(message: MQTTMessage): PanasonicMQTTDeviceState | null {
    try {
      const payload = typeof message.payload === 'string' 
        ? message.payload 
        : message.payload.toString()
      
      const data = JSON.parse(payload)
      return {
        power: data.power === 'on' || data.power === true || data.powerState === 'on',
        mode: data.mode || data.operationMode,
        temperature: data.temperature || data.currentTemperature,
        targetTemperature: data.targetTemperature || data.setTemperature,
        fanSpeed: data.fanSpeed || data.fanLevel,
        swing: data.swing === 'on' || data.swing === true,
        eco: data.eco === 'on' || data.eco === true,
        online: data.online !== undefined ? data.online : true,
        ...data,
      }
    } catch (error) {
      console.error('Panasonic MQTT: Failed to parse state message', error)
      return null
    }
  }

  // 生成控制命令訊息
  static createCommandMessage(deviceId: string, command: PanasonicMQTTControlCommand): MQTTMessage {
    const topic = this.getCommandTopic(deviceId)
    const payload: any = {}

    switch (command.action) {
      case 'power_on':
        payload.power = true
        break
      case 'power_off':
        payload.power = false
        break
      case 'set_temperature':
        payload.temperature = command.temperature ?? command.value
        break
      case 'set_mode':
        payload.mode = command.mode ?? command.value
        break
      case 'set_fan_speed':
        payload.fanSpeed = command.fanSpeed ?? command.value
        break
      case 'set_swing':
        payload.swing = command.swing ?? command.value
        break
      case 'set_eco':
        payload.eco = command.eco ?? command.value
        break
      default:
        // 通用命令：直接使用提供的值
        if (command.power !== undefined) payload.power = command.power
        if (command.mode !== undefined) payload.mode = command.mode
        if (command.temperature !== undefined) payload.temperature = command.temperature
        if (command.fanSpeed !== undefined) payload.fanSpeed = command.fanSpeed
        if (command.swing !== undefined) payload.swing = command.swing
        if (command.eco !== undefined) payload.eco = command.eco
        if (command.value !== undefined) {
          Object.assign(payload, command.value)
        }
    }

    return {
      topic,
      payload: JSON.stringify(payload),
      qos: 1, // Panasonic 使用 QoS 1 確保訊息送達
    }
  }

  // 創建 Panasonic 設備物件
  static createDevice(deviceId: string, name: string, metadata?: Record<string, any>): IoTDevice {
    return {
      id: deviceId,
      name,
      vendor: 'panasonic',
      topic: this.getStatusTopic(deviceId),
      status: 'offline',
      metadata: {
        commandTopic: this.getCommandTopic(deviceId),
        statusTopic: this.getStatusTopic(deviceId),
        ...metadata,
      },
    }
  }

  // 常見 Panasonic 控制命令
  static commands = {
    powerOn: (deviceId: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'power_on' }),
    
    powerOff: (deviceId: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'power_off' }),
    
    setTemperature: (deviceId: string, temperature: number): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_temperature', temperature }),
    
    setMode: (deviceId: string, mode: string): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_mode', mode }),
    
    setFanSpeed: (deviceId: string, speed: number | string): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_fan_speed', fanSpeed: speed }),
    
    setSwing: (deviceId: string, swing: boolean): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_swing', swing }),
    
    setEco: (deviceId: string, eco: boolean): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'set_eco', eco }),
  }
}
