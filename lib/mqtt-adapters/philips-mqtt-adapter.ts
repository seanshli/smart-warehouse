// Philips Hue MQTT 適配器
// 處理 Philips Hue 設備的 MQTT 通訊協議（通過 MQTT Bridge）
// Philips Hue MQTT Adapter - handles Philips Hue devices via MQTT Bridge

import { MQTTMessage, IoTDevice } from '../mqtt-client'

// Philips 設備狀態介面
export interface PhilipsMQTTDeviceState {
  power?: boolean // 電源
  brightness?: number // 亮度 (0-254)
  color?: {
    hue?: number // 色調 (0-65535)
    sat?: number // 飽和度 (0-254)
    xy?: [number, number] // XY 座標
  }
  colorTemperature?: number // 色溫 (153-500)
  effect?: string // 效果
  alert?: string // 警報
  reachable?: boolean // 設備是否可達
  [key: string]: any // 其他屬性
}

// Philips 控制命令介面
export interface PhilipsMQTTControlCommand {
  action: string // 操作類型
  on?: boolean // 開關
  bri?: number // 亮度
  hue?: number // 色調
  sat?: number // 飽和度
  xy?: [number, number] // XY 座標
  ct?: number // 色溫
  effect?: string // 效果
  alert?: string // 警報
  value?: any // 通用值
}

/**
 * Philips Hue MQTT 適配器類別
 * 處理 Philips Hue 設備的 MQTT 主題格式和訊息格式
 */
export class PhilipsMQTTAdapter {
  // Philips MQTT 主題格式：philips/{bridge_id}/lights/{light_id}/command 和 philips/{bridge_id}/lights/{light_id}/state
  private static readonly TOPIC_PREFIX = 'philips'
  private static readonly LIGHTS_PREFIX = 'lights'
  private static readonly SENSORS_PREFIX = 'sensors'
  private static readonly COMMAND_TOPIC = 'command'
  private static readonly STATE_TOPIC = 'state'

  // 從 Bridge ID 和 Light ID 生成命令主題
  static getCommandTopic(bridgeId: string, lightId: string): string {
    return `${this.TOPIC_PREFIX}/${bridgeId}/${this.LIGHTS_PREFIX}/${lightId}/${this.COMMAND_TOPIC}`
  }

  // 從 Bridge ID 和 Light ID 生成狀態主題
  static getStateTopic(bridgeId: string, lightId: string): string {
    return `${this.TOPIC_PREFIX}/${bridgeId}/${this.LIGHTS_PREFIX}/${lightId}/${this.STATE_TOPIC}`
  }

  // 從 Bridge ID 和 Sensor ID 生成感測器狀態主題
  static getSensorStateTopic(bridgeId: string, sensorId: string): string {
    return `${this.TOPIC_PREFIX}/${bridgeId}/${this.SENSORS_PREFIX}/${sensorId}/${this.STATE_TOPIC}`
  }

  // 從主題解析 Bridge ID 和 Light ID
  static parseDeviceId(topic: string): { bridgeId: string | null; lightId: string | null; sensorId: string | null } {
    const parts = topic.split('/')
    if (parts.length >= 2 && parts[0] === this.TOPIC_PREFIX) {
      const bridgeId = parts[1]
      if (parts.length >= 4 && parts[2] === this.LIGHTS_PREFIX) {
        return { bridgeId, lightId: parts[3], sensorId: null }
      } else if (parts.length >= 4 && parts[2] === this.SENSORS_PREFIX) {
        return { bridgeId, lightId: null, sensorId: parts[3] }
      }
    }
    return { bridgeId: null, lightId: null, sensorId: null }
  }

  // 解析 Philips 狀態訊息
  static parseStateMessage(message: MQTTMessage): PhilipsMQTTDeviceState | null {
    try {
      const payload = typeof message.payload === 'string' 
        ? message.payload 
        : message.payload.toString()
      
      const data = JSON.parse(payload)
      return {
        power: data.on || data.power || false,
        brightness: data.bri || data.brightness,
        color: data.xy ? {
          xy: data.xy,
          hue: data.hue,
          sat: data.sat,
        } : undefined,
        colorTemperature: data.ct || data.colorTemperature,
        effect: data.effect,
        alert: data.alert,
        reachable: data.reachable,
        ...data,
      }
    } catch (error) {
      console.error('Philips MQTT: Failed to parse state message', error)
      return null
    }
  }

  // 生成控制命令訊息
  static createCommandMessage(bridgeId: string, lightId: string, command: PhilipsMQTTControlCommand): MQTTMessage {
    const topic = this.getCommandTopic(bridgeId, lightId)
    const payload: any = {}

    switch (command.action) {
      case 'power_on':
        payload.on = true
        break
      case 'power_off':
        payload.on = false
        break
      case 'set_brightness':
        payload.bri = command.bri ?? command.value
        break
      case 'set_color':
        if (command.hue !== undefined) payload.hue = command.hue
        if (command.sat !== undefined) payload.sat = command.sat
        if (command.xy) payload.xy = command.xy
        break
      case 'set_color_temperature':
        payload.ct = command.ct ?? command.value
        break
      case 'set_effect':
        payload.effect = command.effect ?? command.value
        break
      case 'set_alert':
        payload.alert = command.alert ?? command.value
        break
      default:
        // 通用命令：直接使用提供的值
        if (command.on !== undefined) payload.on = command.on
        if (command.bri !== undefined) payload.bri = command.bri
        if (command.hue !== undefined) payload.hue = command.hue
        if (command.sat !== undefined) payload.sat = command.sat
        if (command.xy) payload.xy = command.xy
        if (command.ct !== undefined) payload.ct = command.ct
        if (command.effect !== undefined) payload.effect = command.effect
        if (command.alert !== undefined) payload.alert = command.alert
        if (command.value !== undefined) {
          Object.assign(payload, command.value)
        }
    }

    return {
      topic,
      payload: JSON.stringify(payload),
      qos: 1, // Philips 使用 QoS 1 確保訊息送達
    }
  }

  // 創建 Philips 設備物件
  static createDevice(bridgeId: string, lightId: string, name: string, metadata?: Record<string, any>): IoTDevice {
    return {
      id: `${bridgeId}_${lightId}`,
      name,
      vendor: 'philips',
      topic: this.getStateTopic(bridgeId, lightId),
      status: 'offline',
      metadata: {
        bridgeId,
        lightId,
        commandTopic: this.getCommandTopic(bridgeId, lightId),
        stateTopic: this.getStateTopic(bridgeId, lightId),
        ...metadata,
      },
    }
  }

  // 常見 Philips 控制命令
  static commands = {
    powerOn: (bridgeId: string, lightId: string): MQTTMessage => 
      this.createCommandMessage(bridgeId, lightId, { action: 'power_on' }),
    
    powerOff: (bridgeId: string, lightId: string): MQTTMessage => 
      this.createCommandMessage(bridgeId, lightId, { action: 'power_off' }),
    
    setBrightness: (bridgeId: string, lightId: string, brightness: number): MQTTMessage => 
      this.createCommandMessage(bridgeId, lightId, { action: 'set_brightness', bri: brightness }),
    
    setColor: (bridgeId: string, lightId: string, color: { hue?: number; sat?: number; xy?: [number, number] }): MQTTMessage => 
      this.createCommandMessage(bridgeId, lightId, { action: 'set_color', ...color }),
    
    setColorTemperature: (bridgeId: string, lightId: string, ct: number): MQTTMessage => 
      this.createCommandMessage(bridgeId, lightId, { action: 'set_color_temperature', ct }),
    
    setEffect: (bridgeId: string, lightId: string, effect: string): MQTTMessage => 
      this.createCommandMessage(bridgeId, lightId, { action: 'set_effect', effect }),
  }
}
