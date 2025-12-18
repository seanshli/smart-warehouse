// KNX MQTT 適配器
// 處理 KNX 設備的 MQTT 通訊協議（通過 KNX2MQTT 網關）
// KNX MQTT Adapter - handles KNX devices via KNX2MQTT gateway

import { MQTTMessage, IoTDevice } from '../mqtt-client'

// KNX 設備狀態介面
export interface KNXDeviceState {
  // 基本狀態
  value?: number | boolean | string // 值（根據 DPT 類型）
  dpt?: string // Data Point Type (如 "1.001" for boolean, "5.001" for 0-100%)
  
  // 開關狀態
  state?: boolean | 'ON' | 'OFF' // 開關狀態
  
  // 數值狀態
  brightness?: number // 亮度 (0-100%)
  temperature?: number // 溫度
  humidity?: number // 濕度
  pressure?: number // 壓力
  
  // 位置/百分比
  position?: number // 位置 (0-100%)
  dimming?: number // 調光 (0-100%)
  
  // 場景控制
  scene?: number // 場景編號
  
  // 時間
  time?: string // 時間字符串
  
  // 原始數據
  raw?: any // 原始 KNX 數據
  [key: string]: any // 其他屬性
}

// KNX 控制命令介面
export interface KNXControlCommand {
  action: string // 操作類型
  value?: number | boolean | string // 值
  dpt?: string // Data Point Type（可選，用於指定數據類型）
  [key: string]: any // 其他屬性
}

/**
 * KNX MQTT 適配器類別
 * 處理 KNX 設備的 MQTT 主題格式和訊息格式（通過 KNX2MQTT 網關）
 */
export class KNXAdapter {
  // KNX2MQTT 主題格式：knx/{group_address} 或 knx/{area}/{line}/{device}/{object}
  private static readonly TOPIC_PREFIX = 'knx'
  private static readonly SET_SUFFIX = 'set'

  /**
   * 從群組地址生成狀態主題
   * Group address format: "1/2/3" or "1.2.3"
   */
  static getStatusTopic(groupAddress: string): string {
    // Normalize group address (replace dots with slashes if needed)
    const normalized = groupAddress.replace(/\./g, '/')
    return `${this.TOPIC_PREFIX}/${normalized}`
  }

  /**
   * 從群組地址生成命令主題
   */
  static getCommandTopic(groupAddress: string): string {
    const normalized = groupAddress.replace(/\./g, '/')
    return `${this.TOPIC_PREFIX}/${normalized}/${this.SET_SUFFIX}`
  }

  /**
   * 從主題解析群組地址
   */
  static parseGroupAddress(topic: string): string | null {
    // Format: knx/{group_address} or knx/{group_address}/set
    if (topic.startsWith(this.TOPIC_PREFIX + '/')) {
      const parts = topic.split('/')
      if (parts.length >= 2) {
        // Remove 'set' suffix if present
        if (parts[parts.length - 1] === this.SET_SUFFIX) {
          parts.pop()
        }
        // Return group address (parts[1] to parts[n])
        return parts.slice(1).join('/')
      }
    }
    return null
  }

  /**
   * 解析 KNX 狀態訊息
   */
  static parseStateMessage(message: MQTTMessage): KNXDeviceState | null {
    try {
      const payload = typeof message.payload === 'string' 
        ? message.payload 
        : message.payload.toString()
      
      // KNX2MQTT 使用 JSON 格式
      const data = JSON.parse(payload)
      
      const state: KNXDeviceState = {
        value: data.value,
        dpt: data.dpt || data.DPT,
        state: data.value === true || data.value === 1 || data.value === 'ON' || data.value === 'on',
        brightness: data.brightness || (typeof data.value === 'number' && data.value >= 0 && data.value <= 100 ? data.value : undefined),
        temperature: data.temperature || data.temp,
        humidity: data.humidity,
        pressure: data.pressure,
        position: data.position,
        dimming: data.dimming,
        scene: data.scene,
        time: data.time,
        raw: data,
        ...data,
      }
      
      return state
    } catch (error) {
      console.error('KNX: Failed to parse state message', error)
      return null
    }
  }

  /**
   * 生成控制命令訊息
   */
  static createCommandMessage(
    groupAddress: string, 
    command: KNXControlCommand
  ): MQTTMessage {
    const topic = this.getCommandTopic(groupAddress)
    const payload: any = {}

    // 根據操作類型構建命令
    switch (command.action) {
      case 'power_on':
      case 'on':
        payload.value = true
        break
      case 'power_off':
      case 'off':
        payload.value = false
        break
      case 'toggle':
        payload.value = 'toggle'
        break
      case 'set_brightness':
      case 'set_dimming':
        payload.value = command.value
        payload.dpt = command.dpt || '5.001' // Default DPT for dimming
        break
      case 'set_temperature':
        payload.value = command.value
        payload.dpt = command.dpt || '9.001' // Default DPT for temperature
        break
      case 'set_position':
        payload.value = command.value
        payload.dpt = command.dpt || '5.001' // Default DPT for percentage
        break
      case 'set_scene':
        payload.value = command.value
        payload.dpt = command.dpt || '18.001' // Default DPT for scene
        break
      default:
        // 通用命令：直接使用提供的值
        payload.value = command.value
        if (command.dpt) {
          payload.dpt = command.dpt
        }
        // Copy other properties
        Object.keys(command).forEach(key => {
          if (key !== 'action' && key !== 'value' && key !== 'dpt') {
            payload[key] = command[key]
          }
        })
    }

    return {
      topic,
      payload: JSON.stringify(payload),
      qos: 1, // KNX 使用 QoS 1 確保訊息送達
    }
  }

  /**
   * 創建 KNX 設備物件
   */
  static createDevice(
    groupAddress: string, 
    name: string, 
    metadata?: Record<string, any>
  ): IoTDevice {
    const statusTopic = this.getStatusTopic(groupAddress)
    const commandTopic = this.getCommandTopic(groupAddress)

    return {
      id: groupAddress.replace(/\//g, '_').replace(/\./g, '_'), // Use group address as ID
      name,
      vendor: 'knx',
      topic: statusTopic,
      status: 'offline',
      metadata: {
        groupAddress,
        commandTopic,
        statusTopic,
        bridge: 'knx2mqtt', // 標記使用 KNX2MQTT 橋接
        ...metadata,
      },
    }
  }

  /**
   * 常見 KNX 控制命令
   */
  static commands = {
    powerOn: (groupAddress: string): MQTTMessage => 
      this.createCommandMessage(groupAddress, { action: 'power_on' }),
    
    powerOff: (groupAddress: string): MQTTMessage => 
      this.createCommandMessage(groupAddress, { action: 'power_off' }),
    
    toggle: (groupAddress: string): MQTTMessage => 
      this.createCommandMessage(groupAddress, { action: 'toggle' }),
    
    setBrightness: (groupAddress: string, brightness: number, dpt?: string): MQTTMessage => 
      this.createCommandMessage(groupAddress, { action: 'set_brightness', value: brightness, dpt }),
    
    setTemperature: (groupAddress: string, temperature: number, dpt?: string): MQTTMessage => 
      this.createCommandMessage(groupAddress, { action: 'set_temperature', value: temperature, dpt }),
    
    setPosition: (groupAddress: string, position: number, dpt?: string): MQTTMessage => 
      this.createCommandMessage(groupAddress, { action: 'set_position', value: position, dpt }),
    
    setScene: (groupAddress: string, scene: number, dpt?: string): MQTTMessage => 
      this.createCommandMessage(groupAddress, { action: 'set_scene', value: scene, dpt }),
  }
}
