// Shelly MQTT 適配器
// 處理 Shelly 設備的 MQTT 通訊協議（支援 Gen 1 和 Gen 2）

import { MQTTMessage, IoTDevice } from '../mqtt-client'

// Shelly 設備狀態介面
export interface ShellyDeviceState {
  power?: boolean | string // 電源狀態（on/off 或 true/false）
  relay?: number // 繼電器編號（Gen 1）
  switch?: number // 開關編號（Gen 2）
  temperature?: number // 溫度（如果有感測器）
  energy?: number // 能耗（如果有監測）
  [key: string]: any // 其他屬性
}

// Shelly 設備控制命令介面
export interface ShellyControlCommand {
  action: string // 操作（power_on, power_off, toggle）
  channel?: number // 通道/繼電器編號（Gen 1: relay channel, Gen 2: switch ID）
  generation?: 'gen1' | 'gen2' // 設備世代
}

/**
 * Shelly MQTT 適配器類別
 * 處理 Shelly 設備的 MQTT 主題格式和訊息格式
 * 支援 Gen 1 和 Gen 2 設備
 */
export class ShellyAdapter {
  // Gen 1 主題格式：shellies/<device_name>/relay/<channel>
  private static readonly GEN1_PREFIX = 'shellies'
  private static readonly GEN1_RELAY = 'relay'
  private static readonly GEN1_COMMAND = 'command'

  // Gen 2 主題格式：<topic_prefix>/status/switch:<id> 或 <topic_prefix>/command/switch:<id>
  private static readonly GEN2_STATUS = 'status'
  private static readonly GEN2_COMMAND = 'command'
  private static readonly GEN2_SWITCH = 'switch'

  /**
   * 檢測設備世代（Gen 1 或 Gen 2）
   */
  static detectGeneration(deviceId: string, topic?: string): 'gen1' | 'gen2' {
    // Gen 1 設備通常以 "shelly" 開頭（如 shelly1-1234）
    // Gen 2 設備通常以 "shellyplus" 或 "shellypro" 開頭（如 shellyplus1-5678）
    if (deviceId.startsWith('shellyplus') || deviceId.startsWith('shellypro')) {
      return 'gen2'
    }
    
    // 如果提供了主題，根據主題格式判斷
    if (topic) {
      if (topic.startsWith(this.GEN1_PREFIX)) {
        return 'gen1'
      }
      if (topic.includes('/status/switch:') || topic.includes('/command/switch:')) {
        return 'gen2'
      }
    }
    
    // 預設為 Gen 1（更常見）
    return 'gen1'
  }

  /**
   * Gen 1: 從設備 ID 和通道生成命令主題
   */
  static getGen1CommandTopic(deviceId: string, channel: number = 0): string {
    return `${this.GEN1_PREFIX}/${deviceId}/${this.GEN1_RELAY}/${channel}/${this.GEN1_COMMAND}`
  }

  /**
   * Gen 1: 從設備 ID 和通道生成狀態主題
   */
  static getGen1StatusTopic(deviceId: string, channel: number = 0): string {
    return `${this.GEN1_PREFIX}/${deviceId}/${this.GEN1_RELAY}/${channel}`
  }

  /**
   * Gen 2: 從設備 ID 和開關 ID 生成命令主題
   */
  static getGen2CommandTopic(deviceId: string, switchId: number = 0): string {
    return `${deviceId}/${this.GEN2_COMMAND}/${this.GEN2_SWITCH}:${switchId}`
  }

  /**
   * Gen 2: 從設備 ID 和開關 ID 生成狀態主題
   */
  static getGen2StatusTopic(deviceId: string, switchId: number = 0): string {
    return `${deviceId}/${this.GEN2_STATUS}/${this.GEN2_SWITCH}:${switchId}`
  }

  /**
   * 從主題解析設備 ID 和通道/開關 ID
   */
  static parseDeviceId(topic: string): { deviceId: string | null; channel?: number; generation?: 'gen1' | 'gen2' } {
    // Gen 1 格式：shellies/<device_name>/relay/<channel>[/command]
    if (topic.startsWith(this.GEN1_PREFIX)) {
      const parts = topic.split('/')
      if (parts.length >= 3) {
        const deviceId = parts[1]
        const channel = parts[3] ? parseInt(parts[3], 10) : 0
        return { deviceId, channel, generation: 'gen1' }
      }
    }
    
    // Gen 2 格式：<topic_prefix>/status/switch:<id> 或 <topic_prefix>/command/switch:<id>
    const gen2Match = topic.match(/^([^/]+)\/(?:status|command)\/switch:(\d+)$/)
    if (gen2Match) {
      const deviceId = gen2Match[1]
      const switchId = parseInt(gen2Match[2], 10)
      return { deviceId, channel: switchId, generation: 'gen2' }
    }
    
    return { deviceId: null }
  }

  /**
   * 解析 Shelly 狀態訊息
   */
  static parseStateMessage(message: MQTTMessage, generation?: 'gen1' | 'gen2'): ShellyDeviceState | null {
    try {
      const payload = typeof message.payload === 'string' 
        ? message.payload 
        : message.payload.toString()
      
      // 檢測世代（如果未提供）
      if (!generation) {
        generation = this.detectGeneration('', message.topic)
      }

      if (generation === 'gen1') {
        // Gen 1 使用簡單字串格式：on 或 off
        const state: ShellyDeviceState = {
          power: payload.trim().toLowerCase() === 'on',
        }
        return state
      } else {
        // Gen 2 使用 JSON 格式
        try {
          const data = JSON.parse(payload)
          const state: ShellyDeviceState = {
            power: data.output === true || data.output === 'on',
            temperature: data.temperature?.tC,
            energy: data.energy,
            ...data,
          }
          return state
        } catch {
          // 如果不是 JSON，嘗試解析簡單格式
          const state: ShellyDeviceState = {
            power: payload.trim().toLowerCase() === 'on',
          }
          return state
        }
      }
    } catch (error) {
      console.error('Shelly: Failed to parse state message', error)
      return null
    }
  }

  /**
   * 生成控制命令訊息
   */
  static createCommandMessage(
    deviceId: string, 
    command: ShellyControlCommand,
    generation?: 'gen1' | 'gen2'
  ): MQTTMessage {
    // 檢測世代（如果未提供）
    if (!generation) {
      generation = this.detectGeneration(deviceId)
    }

    const channel = command.channel ?? 0
    let topic: string
    let payload: string

    if (generation === 'gen1') {
      topic = this.getGen1CommandTopic(deviceId, channel)
      // Gen 1 使用簡單字串命令
      if (command.action === 'power_on') {
        payload = 'on'
      } else if (command.action === 'power_off') {
        payload = 'off'
      } else if (command.action === 'toggle') {
        payload = 'toggle'
      } else {
        payload = command.action
      }
    } else {
      topic = this.getGen2CommandTopic(deviceId, channel)
      // Gen 2 使用簡單字串命令（與 Gen 1 相同）
      if (command.action === 'power_on') {
        payload = 'on'
      } else if (command.action === 'power_off') {
        payload = 'off'
      } else if (command.action === 'toggle') {
        payload = 'toggle'
      } else {
        payload = command.action
      }
    }

    return {
      topic,
      payload,
      qos: 1, // Shelly 使用 QoS 1 確保訊息送達
    }
  }

  /**
   * 創建 Shelly 設備物件
   */
  static createDevice(
    deviceId: string, 
    name: string, 
    channel: number = 0,
    generation?: 'gen1' | 'gen2',
    metadata?: Record<string, any>
  ): IoTDevice {
    if (!generation) {
      generation = this.detectGeneration(deviceId)
    }

    const statusTopic = generation === 'gen1'
      ? this.getGen1StatusTopic(deviceId, channel)
      : this.getGen2StatusTopic(deviceId, channel)
    
    const commandTopic = generation === 'gen1'
      ? this.getGen1CommandTopic(deviceId, channel)
      : this.getGen2CommandTopic(deviceId, channel)

    return {
      id: deviceId,
      name,
      vendor: 'shelly',
      topic: statusTopic,
      status: 'offline',
      metadata: {
        commandTopic,
        statusTopic,
        channel,
        generation,
        ...metadata,
      },
    }
  }

  /**
   * 常見 Shelly 控制命令
   */
  static commands = {
    powerOn: (deviceId: string, channel: number = 0, generation?: 'gen1' | 'gen2'): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'power_on', channel, generation }, generation),
    
    powerOff: (deviceId: string, channel: number = 0, generation?: 'gen1' | 'gen2'): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'power_off', channel, generation }, generation),
    
    toggle: (deviceId: string, channel: number = 0, generation?: 'gen1' | 'gen2'): MQTTMessage => 
      this.createCommandMessage(deviceId, { action: 'toggle', channel, generation }, generation),
  }
}

