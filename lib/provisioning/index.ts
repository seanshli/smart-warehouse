// 統一配網模組導出
// 提供所有品牌的配網適配器
// Unified Provisioning Module Export - Provides provisioning adapters for all brands

export { BaseProvisioningAdapter, type ProvisioningConfig, type ProvisioningResult, type ProvisioningStatus, type ProvisioningMode } from './base-provisioning'

// 導入各品牌配網適配器
import { TuyaProvisioning } from '../tuya-provisioning'
import { MideaProvisioningAdapter } from './midea-provisioning'
import { PhilipsProvisioningAdapter } from './philips-provisioning'
import { PanasonicProvisioningAdapter } from './panasonic-provisioning'
import { ESPProvisioningAdapter } from './esp-provisioning'

import { BaseProvisioningAdapter as BaseAdapter } from './base-provisioning'
import type { ProvisioningConfig, ProvisioningResult } from './base-provisioning'

/**
 * 統一配網工廠
 * 根據品牌返回對應的配網適配器
 */
export class UnifiedProvisioningFactory {
  /**
   * 獲取配網適配器
   */
  static getAdapter(vendor: 'tuya' | 'midea' | 'philips' | 'panasonic' | 'esp'): BaseAdapter {
    switch (vendor) {
      case 'tuya':
        // Tuya 使用不同的結構，需要適配
        return new TuyaProvisioningAdapter() as any
      case 'midea':
        return new MideaProvisioningAdapter()
      case 'philips':
        return new PhilipsProvisioningAdapter()
      case 'panasonic':
        return new PanasonicProvisioningAdapter()
      case 'esp':
        return new ESPProvisioningAdapter()
      default:
        throw new Error(`Unsupported vendor: ${vendor}`)
    }
  }

  /**
   * 啟動配網流程
   */
  static async startProvisioning(config: ProvisioningConfig): Promise<ProvisioningResult> {
    const adapter = this.getAdapter(config.vendor as any)
    return await adapter.startProvisioning(config)
  }

  /**
   * 查詢配網狀態
   */
  static async queryStatus(vendor: 'tuya' | 'midea' | 'philips' | 'panasonic' | 'esp', token: string): Promise<ProvisioningResult> {
    const adapter = this.getAdapter(vendor)
    return await adapter.queryStatus(token)
  }

  /**
   * 停止配網流程
   */
  static async stopProvisioning(vendor: 'tuya' | 'midea' | 'philips' | 'panasonic' | 'esp', token: string): Promise<boolean> {
    const adapter = this.getAdapter(vendor)
    return await adapter.stopProvisioning(token)
  }

  /**
   * 發現設備
   */
  static async discoverDevices(config: ProvisioningConfig): Promise<ProvisioningResult[]> {
    const adapter = this.getAdapter(config.vendor)
    if (adapter.discoverDevices) {
      return await adapter.discoverDevices(config)
    }
    return []
  }
}

// Tuya 配網適配器包裝（適配現有的 TuyaProvisioning 類）
class TuyaProvisioningAdapter extends BaseAdapter {
  readonly vendor = 'tuya'
  private tuyaProvisioning: any

  constructor() {
    super()
    // 延遲加載 TuyaProvisioning
  }

  async startProvisioning(config: ProvisioningConfig): Promise<ProvisioningResult> {
    const { createTuyaProvisioning } = await import('../tuya-provisioning')
    
    // 手動配網不需要 WiFi 信息
    if (config.mode === 'manual' && config.deviceId) {
      // 手動配網直接返回成功
      return {
        success: true,
        deviceId: config.deviceId,
        deviceName: `Tuya Device ${config.deviceId}`,
        status: 'success',
      }
    }

    // Zigbee 和 Bluetooth 配網可能不需要 WiFi
    const needsWifi = !['zigbee', 'bt', 'manual'].includes(config.mode || '')
    
    if (needsWifi && (!config.ssid || !config.password)) {
      return {
        success: false,
        error: 'Wi-Fi SSID and password are required',
        status: 'failed',
      }
    }

    const provisioning = createTuyaProvisioning({
      accessId: process.env.TUYA_ACCESS_ID || '',
      accessSecret: process.env.TUYA_ACCESS_SECRET || '',
      region: process.env.TUYA_REGION || 'cn',
      ssid: config.ssid || '',
      password: config.password || '',
      mode: config.mode as any,
    })

    try {
      const token = await provisioning.getProvisioningToken()
      const result = await provisioning.startProvisioning(
        token,
        config.ssid || '',
        config.password || '',
        config.mode as any,
        {
          deviceId: config.deviceId,
          zigbeeGatewayId: config.zigbeeGatewayId,
          bluetoothMac: config.bluetoothMac,
        }
      )
      
      return {
        success: result.success,
        deviceId: result.deviceId,
        deviceName: result.deviceName,
        error: result.error,
        status: result.status,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Tuya provisioning failed',
        status: 'failed',
      }
    }
  }

  async queryStatus(token: string): Promise<ProvisioningResult> {
    const { createTuyaProvisioning } = await import('../tuya-provisioning')
    
    const provisioning = createTuyaProvisioning({
      accessId: process.env.TUYA_ACCESS_ID || '',
      accessSecret: process.env.TUYA_ACCESS_SECRET || '',
      region: process.env.TUYA_REGION || 'cn',
      ssid: '',
      password: '',
    })

    const result = await provisioning.queryProvisioningStatus(token)
    
    return {
      success: result.success,
      deviceId: result.deviceId,
      deviceName: result.deviceName,
      error: result.error,
      status: result.status,
    }
  }

  async stopProvisioning(token: string): Promise<boolean> {
    const { createTuyaProvisioning } = await import('../tuya-provisioning')
    
    const provisioning = createTuyaProvisioning({
      accessId: process.env.TUYA_ACCESS_ID || '',
      accessSecret: process.env.TUYA_ACCESS_SECRET || '',
      region: process.env.TUYA_REGION || 'cn',
      ssid: '',
      password: '',
    })

    return await provisioning.stopProvisioning(token)
  }
}

