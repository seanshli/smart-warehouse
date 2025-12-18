// KNX 配網模組
// 處理 KNX 設備的配網流程（通過 KNX2MQTT 網關）
// KNX Provisioning Module - Handles KNX device provisioning via KNX2MQTT gateway

import { BaseProvisioningAdapter, ProvisioningConfig, ProvisioningResult, ProvisioningStatus } from './base-provisioning'

/**
 * KNX 配網適配器
 * 通過 KNX2MQTT 網關發現和配置 KNX 設備
 */
export class KNXProvisioningAdapter extends BaseProvisioningAdapter {
  readonly vendor = 'knx'

  /**
   * 啟動配網流程
   * KNX 配網需要連接到 KNX2MQTT 網關並發現設備
   */
  async startProvisioning(config: ProvisioningConfig): Promise<ProvisioningResult> {
    try {
      // KNX 配網需要 MQTT broker 配置
      if (!config.baseUrl) {
        return {
          success: false,
          error: 'MQTT Broker URL is required for KNX devices. Please configure the KNX2MQTT gateway connection.',
          status: 'failed',
        }
      }

      // 步驟 1: 驗證 MQTT broker 連接
      const isConnected = await this.verifyMQTTConnection(config.baseUrl, config.apiKey, config.accessToken)
      
      if (!isConnected) {
        return {
          success: false,
          error: 'Failed to connect to MQTT broker. Please check the broker URL and credentials.',
          status: 'failed',
        }
      }

      // 步驟 2: 發現 KNX 設備（通過 KNX2MQTT 網關）
      const devices = await this.discoverDevices(config)
      
      if (devices.length === 0) {
        return {
          success: false,
          error: 'No KNX devices found. Please ensure:\n1. KNX2MQTT gateway is connected\n2. KNX devices are on the bus\n3. Group addresses are configured',
          status: 'failed',
        }
      }

      // 如果提供了特定的 group address，只返回該設備
      if (config.deviceId) {
        const device = devices.find(d => d.deviceId === config.deviceId)
        if (device) {
          return device
        }
        return {
          success: false,
          error: `KNX device with group address ${config.deviceId} not found`,
          status: 'failed',
        }
      }

      // 返回第一個發現的設備
      return devices[0]
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to start KNX provisioning',
        status: 'failed',
      }
    }
  }

  /**
   * 驗證 MQTT broker 連接
   */
  private async verifyMQTTConnection(brokerUrl: string, username?: string, password?: string): Promise<boolean> {
    try {
      // 通過 API 端點驗證 MQTT 連接
      const response = await fetch('/api/mqtt/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.connected === true
      }

      return false
    } catch (error) {
      console.error('KNX Provisioning: Failed to verify MQTT connection:', error)
      return false
    }
  }

  /**
   * 發現 KNX 設備
   */
  async discoverDevices(config: ProvisioningConfig): Promise<ProvisioningResult[]> {
    try {
      // 通過 API 端點發現 KNX 設備
      // 這需要 KNX bridge 服務已經運行
      const response = await fetch('/api/mqtt/knx/devices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const devices = Array.isArray(data.devices) ? data.devices : []

      return devices.map((device: any) => ({
        success: true,
        deviceId: device.groupAddress || device.deviceId,
        deviceName: device.name || `KNX ${device.groupAddress || device.deviceId}`,
        deviceInfo: {
          groupAddress: device.groupAddress,
          type: device.type,
          dpt: device.dpt,
          online: device.online,
          mqttBrokerUrl: config.baseUrl,
          mqttUsername: config.apiKey,
          mqttPassword: config.accessToken,
        },
        status: 'success' as ProvisioningStatus,
      }))
    } catch (error: any) {
      console.error('KNX Provisioning: Failed to discover devices:', error)
      
      // 如果 API 端點不存在，返回手動配置選項
      return [{
        success: false,
        error: 'KNX bridge service not available. Please configure KNX2MQTT gateway manually.',
        status: 'failed' as ProvisioningStatus,
      }]
    }
  }

  /**
   * 查詢配網狀態
   */
  async queryStatus(token: string): Promise<ProvisioningResult> {
    // KNX 配網通常是即時的，不需要狀態查詢
    // 但可以檢查設備是否在線
    try {
      const response = await fetch(`/api/mqtt/knx/devices/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const device = await response.json()
        return {
          success: true,
          deviceId: device.groupAddress || token,
          deviceName: device.name || `KNX ${token}`,
          status: device.online ? 'success' : 'failed',
        }
      }

      return {
        success: false,
        error: 'Device not found',
        status: 'failed',
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to query KNX device status',
        status: 'failed',
      }
    }
  }

  /**
   * 停止配網流程
   */
  async stopProvisioning(token: string): Promise<boolean> {
    // KNX 配網不需要停止操作
    return true
  }
}
