// Panasonic RESTful API 適配器
// 處理 Panasonic 設備的 RESTful API 通訊

import { BaseAdapter, DeviceState, ControlCommand, AdapterConfig, ConnectionType } from './base-adapter'
import { IoTDevice } from '../mqtt-client'

// Panasonic 設備狀態
export interface PanasonicDeviceState extends DeviceState {
  power?: boolean // 電源
  mode?: string // 模式（冷氣、暖氣、除濕等）
  temperature?: number // 溫度
  targetTemperature?: number // 目標溫度
  fanSpeed?: number | string // 風速
  swing?: boolean // 擺風
  eco?: boolean // 節能模式
}

// Panasonic 控制命令
export interface PanasonicControlCommand extends ControlCommand {
  power?: boolean | string // 電源（on/off 或 true/false）
  mode?: string // 模式
  temperature?: number // 溫度
  fanSpeed?: number | string // 風速
  swing?: boolean | string // 擺風
  eco?: boolean // 節能模式
}

/**
 * Panasonic RESTful API 適配器
 * 使用 Panasonic Cloud API 或本地 API
 */
export class PanasonicAdapter extends BaseAdapter {
  readonly connectionType: ConnectionType = 'restful'
  readonly vendor = 'panasonic'

  // 創建 Panasonic 設備物件
  createDevice(deviceId: string, name: string, config?: AdapterConfig): IoTDevice {
    return {
      id: deviceId,
      name,
      vendor: 'panasonic' as any,
      topic: `panasonic/${deviceId}`, // 用於識別的主題格式
      status: 'offline',
      metadata: {
        connectionType: 'restful',
        baseUrl: config?.baseUrl,
        apiKey: config?.apiKey,
        accessToken: config?.accessToken,
        ...config,
      },
    }
  }

  // 解析 Panasonic 狀態
  parseState(data: any): PanasonicDeviceState | null {
    try {
      const state = data.state || data.parameters || data
      return {
        power: state.power === 'on' || state.power === true || state.powerState === 'on',
        mode: state.mode || state.operationMode,
        temperature: state.temperature || state.currentTemperature,
        targetTemperature: state.targetTemperature || state.setTemperature,
        fanSpeed: state.fanSpeed || state.fanLevel,
        swing: state.swing === 'on' || state.swing === true,
        eco: state.eco === 'on' || state.eco === true,
      }
    } catch (error) {
      console.error('Panasonic: Failed to parse state', error)
      return null
    }
  }

  // 生成控制命令
  createCommand(action: string, value?: any): PanasonicControlCommand {
    const command: PanasonicControlCommand = { action }

    switch (action) {
      case 'power_on':
        command.power = true
        break
      case 'power_off':
        command.power = false
        break
      case 'set_temperature':
        command.temperature = value
        break
      case 'set_mode':
        command.mode = value
        break
      case 'set_fan_speed':
        command.fanSpeed = value
        break
      case 'set_swing':
        command.swing = value
        break
      case 'set_eco':
        command.eco = value
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
  async getDeviceState(deviceId: string, config: AdapterConfig): Promise<PanasonicDeviceState | null> {
    if (!config.baseUrl) {
      throw new Error('Panasonic adapter requires baseUrl')
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // 添加認證
      if (config.apiKey) {
        headers['X-API-Key'] = config.apiKey
      }
      if (config.accessToken) {
        headers['Authorization'] = `Bearer ${config.accessToken}`
      }

      const url = `${config.baseUrl}/devices/${deviceId}/status`
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return this.parseState(data)
    } catch (error) {
      console.error('Panasonic: Failed to get device state', error)
      return null
    }
  }

  // 發送控制命令（RESTful API）
  async sendCommand(deviceId: string, command: PanasonicControlCommand, config: AdapterConfig): Promise<boolean> {
    if (!config.baseUrl) {
      throw new Error('Panasonic adapter requires baseUrl')
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // 添加認證
      if (config.apiKey) {
        headers['X-API-Key'] = config.apiKey
      }
      if (config.accessToken) {
        headers['Authorization'] = `Bearer ${config.accessToken}`
      }

      // 構建請求體（移除 action 欄位）
      const { action, ...body } = command

      const url = `${config.baseUrl}/devices/${deviceId}/control`
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`)
      }

      return true
    } catch (error) {
      console.error('Panasonic: Failed to send command', error)
      return false
    }
  }

  // 常見 Panasonic 控制命令
  static commands = {
    powerOn: (deviceId: string, config: AdapterConfig): PanasonicControlCommand => 
      ({ action: 'power_on' }),
    
    powerOff: (deviceId: string, config: AdapterConfig): PanasonicControlCommand => 
      ({ action: 'power_off' }),
    
    setTemperature: (deviceId: string, temperature: number, config: AdapterConfig): PanasonicControlCommand => 
      ({ action: 'set_temperature', temperature }),
    
    setMode: (deviceId: string, mode: string, config: AdapterConfig): PanasonicControlCommand => 
      ({ action: 'set_mode', mode }),
    
    setFanSpeed: (deviceId: string, speed: number | string, config: AdapterConfig): PanasonicControlCommand => 
      ({ action: 'set_fan_speed', fanSpeed: speed }),
  }
}

