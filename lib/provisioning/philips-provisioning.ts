// Philips Hue 配網模組
// 處理 Philips Hue Bridge 的發現和配對流程
// Philips Hue Provisioning Module - Handles Bridge discovery and pairing

import { BaseProvisioningAdapter, ProvisioningConfig, ProvisioningResult, ProvisioningStatus } from './base-provisioning'

/**
 * Philips Hue 配網適配器
 * 通過本地網絡發現 Hue Bridge 並進行配對
 */
export class PhilipsProvisioningAdapter extends BaseProvisioningAdapter {
  readonly vendor = 'philips'
  private discoveryUrl = 'https://discovery.meethue.com' // Hue Bridge 發現服務

  /**
   * 啟動配網流程（發現 Hue Bridge）
   */
  async startProvisioning(config: ProvisioningConfig): Promise<ProvisioningResult> {
    try {
      // 步驟 1: 發現本地網絡中的 Hue Bridge
      const bridges = await this.discoverBridges()
      
      if (bridges.length === 0) {
        return {
          success: false,
          error: 'No Philips Hue Bridge found on local network. Please ensure the bridge is connected and press the bridge button.',
          status: 'failed',
        }
      }

      // 步驟 2: 嘗試配對第一個發現的 Bridge
      const bridge = bridges[0]
      const pairingResult = await this.pairBridge(bridge.internalipaddress, config.apiKey)

      if (pairingResult.success) {
        return {
          success: true,
          deviceId: bridge.id,
          deviceName: bridge.name || `Philips Hue Bridge ${bridge.id}`,
          deviceInfo: {
            internalIp: bridge.internalipaddress,
            macAddress: bridge.macaddress,
            apiKey: pairingResult.apiKey,
          },
          status: 'success',
        }
      }

      return {
        success: false,
        error: pairingResult.error || 'Failed to pair with Hue Bridge. Please press the bridge button and try again.',
        status: 'pairing',
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to discover Philips Hue Bridge',
        status: 'failed',
      }
    }
  }

  /**
   * 發現本地網絡中的 Hue Bridge
   */
  private async discoverBridges(): Promise<any[]> {
    try {
      // 使用 Hue Bridge 發現服務
      const response = await fetch(this.discoveryUrl)
      
      if (!response.ok) {
        // 如果發現服務不可用，嘗試本地網絡掃描
        return await this.scanLocalNetwork()
      }

      const bridges = await response.json()
      return Array.isArray(bridges) ? bridges : []
    } catch (error) {
      // 如果發現服務失敗，嘗試本地網絡掃描
      return await this.scanLocalNetwork()
    }
  }

  /**
   * 掃描本地網絡查找 Hue Bridge
   */
  private async scanLocalNetwork(): Promise<any[]> {
    // 注意：瀏覽器環境無法直接掃描本地網絡
    // 需要通過服務器端實現或使用 UPnP/SSDP
    // 這裡提供基本框架
    
    // 嘗試常見的 Hue Bridge IP 地址
    const commonIPs = [
      '192.168.1.100',
      '192.168.1.101',
      '192.168.0.100',
      '192.168.0.101',
    ]

    const bridges: any[] = []
    
    // 並行檢查常見 IP
    const checks = commonIPs.map(async (ip) => {
      try {
        const response = await fetch(`http://${ip}/api/config`, {
          method: 'GET',
          signal: AbortSignal.timeout(2000), // 2 秒超時
        })
        
        if (response.ok) {
          const config = await response.json()
          return {
            id: config.bridgeid,
            internalipaddress: ip,
            macaddress: config.mac,
            name: config.name,
          }
        }
      } catch (error) {
        // 忽略錯誤，繼續檢查下一個 IP
      }
      return null
    })

    const results = await Promise.all(checks)
    return results.filter((bridge) => bridge !== null) as any[]
  }

  /**
   * 配對 Hue Bridge
   * 需要用戶按下 Bridge 上的按鈕
   */
  private async pairBridge(bridgeIp: string, existingApiKey?: string): Promise<{ success: boolean; apiKey?: string; error?: string }> {
    try {
      // 如果已有 API Key，驗證是否有效
      if (existingApiKey) {
        const isValid = await this.validateApiKey(bridgeIp, existingApiKey)
        if (isValid) {
          return { success: true, apiKey: existingApiKey }
        }
      }

      // 創建新用戶（配對）
      const response = await fetch(`http://${bridgeIp}/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          devicetype: 'smart-warehouse#web',
          generateclientkey: true,
        }),
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to pair with Hue Bridge. Please press the bridge button and try again.',
        }
      }

      const result = await response.json()
      
      // 檢查是否成功配對
      if (result[0]?.success?.username) {
        return {
          success: true,
          apiKey: result[0].success.username,
        }
      }

      // 檢查錯誤
      if (result[0]?.error) {
        const error = result[0].error
        if (error.type === 101) {
          return {
            success: false,
            error: 'Please press the button on your Philips Hue Bridge and try again.',
          }
        }
        return {
          success: false,
          error: error.description || 'Pairing failed',
        }
      }

      return {
        success: false,
        error: 'Unknown pairing error',
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to pair with Hue Bridge',
      }
    }
  }

  /**
   * 驗證 API Key 是否有效
   */
  private async validateApiKey(bridgeIp: string, apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`http://${bridgeIp}/api/${apiKey}/config`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * 查詢配網狀態
   */
  async queryStatus(token: string): Promise<ProvisioningResult> {
    // Philips Hue 配網是即時的，不需要狀態查詢
    return {
      success: true,
      status: 'success',
    }
  }

  /**
   * 停止配網流程
   */
  async stopProvisioning(token: string): Promise<boolean> {
    // Philips Hue 配網是即時的，無法停止
    return true
  }

  /**
   * 發現設備
   */
  async discoverDevices(config: ProvisioningConfig): Promise<ProvisioningResult[]> {
    const bridges = await this.discoverBridges()
    
    return bridges.map((bridge) => ({
      success: true,
      deviceId: bridge.id,
      deviceName: bridge.name || `Philips Hue Bridge ${bridge.id}`,
      deviceInfo: {
        internalIp: bridge.internalipaddress,
        macAddress: bridge.macaddress,
      },
      status: 'success' as ProvisioningStatus,
    }))
  }
}

