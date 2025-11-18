// 統一 IoT 適配器導出
// 支援 MQTT 和 RESTful API 設備

// MQTT 適配器
export { TuyaAdapter } from '../mqtt-adapters/tuya-adapter'
export { ESPAdapter } from '../mqtt-adapters/esp-adapter'
export { MideaAdapter } from '../mqtt-adapters/midea-adapter'

// RESTful API 適配器
export { PhilipsAdapter } from './philips-adapter'
export { PanasonicAdapter } from './panasonic-adapter'

// 基礎介面
export { BaseAdapter, type ConnectionType, type DeviceState, type ControlCommand, type AdapterConfig } from './base-adapter'

import { BaseAdapter, ConnectionType, AdapterConfig } from './base-adapter'
import { DeviceVendor, IoTDevice } from '../mqtt-client'
import { TuyaAdapter } from '../mqtt-adapters/tuya-adapter'
import { ESPAdapter } from '../mqtt-adapters/esp-adapter'
import { MideaAdapter } from '../mqtt-adapters/midea-adapter'
import { PhilipsAdapter } from './philips-adapter'
import { PanasonicAdapter } from './panasonic-adapter'

// 擴展的設備供應商類型（包含 RESTful API 供應商）
export type ExtendedDeviceVendor = DeviceVendor | 'philips' | 'panasonic' | 'generic'

/**
 * 統一適配器工廠
 * 根據供應商類型和連接類型返回對應的適配器
 */
export class UnifiedAdapterFactory {
  // 獲取適配器
  static getAdapter(vendor: ExtendedDeviceVendor): BaseAdapter {
    switch (vendor) {
      // MQTT 適配器
      case 'tuya':
        return new TuyaAdapter() as any
      case 'esp':
        return new ESPAdapter() as any
      case 'midea':
        return new MideaAdapter() as any
      
      // RESTful API 適配器
      case 'philips':
        return new PhilipsAdapter()
      case 'panasonic':
        return new PanasonicAdapter()
      
      default:
        throw new Error(`Unsupported vendor: ${vendor}`)
    }
  }

  // 獲取連接類型
  static getConnectionType(vendor: ExtendedDeviceVendor): ConnectionType {
    switch (vendor) {
      case 'tuya':
      case 'esp':
      case 'midea':
        return 'mqtt'
      case 'philips':
      case 'panasonic':
        return 'restful'
      default:
        return 'mqtt' // 預設為 MQTT
    }
  }

  // 從主題/URL 自動檢測供應商
  static detectVendorFromTopic(topic: string): ExtendedDeviceVendor | null {
    if (topic.startsWith('tuya/')) {
      return 'tuya'
    } else if (topic.startsWith('esp/')) {
      return 'esp'
    } else if (topic.startsWith('midea/')) {
      return 'midea'
    } else if (topic.startsWith('philips/')) {
      return 'philips'
    } else if (topic.startsWith('panasonic/')) {
      return 'panasonic'
    }
    return null
  }

  // 創建設備（統一介面）
  static createDevice(
    vendor: ExtendedDeviceVendor,
    deviceId: string,
    name: string,
    config?: AdapterConfig
  ): IoTDevice {
    const adapter = this.getAdapter(vendor)
    return adapter.createDevice(deviceId, name, config)
  }

  // 獲取設備狀態（統一介面）
  static async getDeviceState(
    vendor: ExtendedDeviceVendor,
    deviceId: string,
    config: AdapterConfig
  ): Promise<any> {
    const adapter = this.getAdapter(vendor)
    
    if (adapter.connectionType === 'restful' && adapter.getDeviceState) {
      return await adapter.getDeviceState(deviceId, config)
    }
    
    // MQTT 設備的狀態通過 MQTT 訊息獲取，不在此處處理
    throw new Error(`getDeviceState not supported for ${vendor} (${adapter.connectionType})`)
  }

  // 發送控制命令（統一介面）
  static async sendCommand(
    vendor: ExtendedDeviceVendor,
    deviceId: string,
    command: any,
    config: AdapterConfig
  ): Promise<boolean> {
    const adapter = this.getAdapter(vendor)
    
    if (adapter.connectionType === 'restful' && adapter.sendCommand) {
      return await adapter.sendCommand(deviceId, command, config)
    }
    
    // MQTT 設備的命令通過 MQTT 發送，不在此處處理
    throw new Error(`sendCommand not supported for ${vendor} (${adapter.connectionType})`)
  }
}

