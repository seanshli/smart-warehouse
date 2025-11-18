// IoT 設備適配器基礎介面
// 統一支援 MQTT 和 RESTful API 的設備適配器

import { IoTDevice } from '../mqtt-client'

// 連接類型
export type ConnectionType = 'mqtt' | 'restful' | 'websocket'

// 設備狀態介面（通用）
export interface DeviceState {
  power?: boolean // 電源狀態
  [key: string]: any // 其他設備特定屬性
}

// 控制命令介面（通用）
export interface ControlCommand {
  action: string // 操作類型
  value?: any // 值
  [key: string]: any // 其他命令參數
}

// 適配器配置介面
export interface AdapterConfig {
  baseUrl?: string // RESTful API 基礎 URL
  apiKey?: string // API 金鑰
  username?: string // 用戶名
  password?: string // 密碼
  mqttTopic?: string // MQTT 主題（如果是 MQTT 設備）
  [key: string]: any // 其他配置
}

// 適配器基礎類別
export abstract class BaseAdapter {
  // 連接類型
  abstract readonly connectionType: ConnectionType
  
  // 供應商名稱
  abstract readonly vendor: string

  // 創建設備物件
  abstract createDevice(deviceId: string, name: string, config?: AdapterConfig): IoTDevice

  // 解析設備狀態
  abstract parseState(data: any): DeviceState | null

  // 生成控制命令
  abstract createCommand(action: string, value?: any): ControlCommand

  // 獲取設備狀態（RESTful API 使用）
  async getDeviceState?(deviceId: string, config: AdapterConfig): Promise<DeviceState | null> {
    throw new Error('getDeviceState not implemented for this adapter')
  }

  // 發送控制命令（RESTful API 使用）
  async sendCommand?(deviceId: string, command: ControlCommand, config: AdapterConfig): Promise<boolean> {
    throw new Error('sendCommand not implemented for this adapter')
  }

  // 從主題/URL 解析設備 ID（MQTT 使用）
  static parseDeviceId?(topic: string): string | null {
    return null
  }
}

