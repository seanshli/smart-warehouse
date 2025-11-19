// Philips Hue RESTful API 適配器
// 處理 Philips Hue 設備的 RESTful API 通訊

import { BaseAdapter, DeviceState, ControlCommand, AdapterConfig, ConnectionType } from './base-adapter'
import { IoTDevice } from '../mqtt-client'

// Philips 設備狀態
export interface PhilipsDeviceState extends DeviceState {
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
}

// Philips 控制命令
export interface PhilipsControlCommand extends ControlCommand {
  on?: boolean // 開關
  bri?: number // 亮度
  hue?: number // 色調
  sat?: number // 飽和度
  xy?: [number, number] // XY 座標
  ct?: number // 色溫
  effect?: string // 效果
  alert?: string // 警報
}

/**
 * Philips Hue RESTful API 適配器
 * 使用 Philips Hue Bridge RESTful API
 */
export class PhilipsAdapter extends BaseAdapter {
  readonly connectionType: ConnectionType = 'restful'
  readonly vendor = 'philips'

  // 創建 Philips 設備物件
  createDevice(deviceId: string, name: string, config?: AdapterConfig): IoTDevice {
    return {
      id: deviceId,
      name,
      vendor: 'philips' as any,
      topic: `philips/${deviceId}`, // 用於識別的主題格式
      status: 'offline',
      metadata: {
        connectionType: 'restful',
        baseUrl: config?.baseUrl,
        apiKey: config?.apiKey,
        ...config,
      },
    }
  }

  // 解析 Philips 狀態
  parseState(data: any): PhilipsDeviceState | null {
    try {
      const state = data.state || data
      return {
        power: state.on || false,
        brightness: state.bri,
        color: state.xy ? {
          xy: state.xy,
          hue: state.hue,
          sat: state.sat,
        } : undefined,
        colorTemperature: state.ct,
        effect: state.effect,
        alert: state.alert,
      }
    } catch (error) {
      console.error('Philips: Failed to parse state', error)
      return null
    }
  }

  // 生成控制命令
  createCommand(action: string, value?: any): PhilipsControlCommand {
    const command: PhilipsControlCommand = { action }

    switch (action) {
      case 'power_on':
        command.on = true
        break
      case 'power_off':
        command.on = false
        break
      case 'set_brightness':
        command.bri = value
        break
      case 'set_color':
        if (value.hue !== undefined) command.hue = value.hue
        if (value.sat !== undefined) command.sat = value.sat
        if (value.xy) command.xy = value.xy
        break
      case 'set_color_temperature':
        command.ct = value
        break
      case 'set_effect':
        command.effect = value
        break
      default:
        // 通用命令
        if (value !== undefined) {
          Object.assign(command, value)
        }
    }

    return command
  }

  // 獲取設備狀態（RESTful API）
  async getDeviceState(deviceId: string, config: AdapterConfig): Promise<PhilipsDeviceState | null> {
    if (!config.baseUrl || !config.apiKey) {
      throw new Error('Philips adapter requires baseUrl and apiKey')
    }

    try {
      const url = `${config.baseUrl}/api/${config.apiKey}/lights/${deviceId}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return this.parseState(data)
    } catch (error) {
      console.error('Philips: Failed to get device state', error)
      return null
    }
  }

  // 發送控制命令（RESTful API）
  async sendCommand(deviceId: string, command: PhilipsControlCommand, config: AdapterConfig): Promise<boolean> {
    if (!config.baseUrl || !config.apiKey) {
      throw new Error('Philips adapter requires baseUrl and apiKey')
    }

    try {
      // 構建請求體（移除 action 欄位）
      const { action, ...body } = command

      const url = `${config.baseUrl}/api/${config.apiKey}/lights/${deviceId}/state`
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`)
      }

      return true
    } catch (error) {
      console.error('Philips: Failed to send command', error)
      return false
    }
  }

  // 常見 Philips 控制命令
  static commands = {
    powerOn: (deviceId: string, config: AdapterConfig): PhilipsControlCommand => 
      ({ action: 'power_on' }),
    
    powerOff: (deviceId: string, config: AdapterConfig): PhilipsControlCommand => 
      ({ action: 'power_off' }),
    
    setBrightness: (deviceId: string, brightness: number, config: AdapterConfig): PhilipsControlCommand => 
      ({ action: 'set_brightness', bri: brightness }),
    
    setColor: (deviceId: string, color: { hue?: number; sat?: number; xy?: [number, number] }, config: AdapterConfig): PhilipsControlCommand => 
      ({ action: 'set_color', ...color }),
    
    setColorTemperature: (deviceId: string, ct: number, config: AdapterConfig): PhilipsControlCommand => 
      ({ action: 'set_color_temperature', ct }),
  }
}

