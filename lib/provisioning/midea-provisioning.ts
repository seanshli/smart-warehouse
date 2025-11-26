// Midea（美的）配網模組
// 處理 Midea 設備的配網流程（AP 模式和藍牙配網）
// Midea Provisioning Module - Handles device provisioning flow

import { BaseProvisioningAdapter, ProvisioningConfig, ProvisioningResult, ProvisioningStatus } from './base-provisioning'
import { startNativeMideaProvisioning, canUseNativeMideaProvisioning } from './midea-native-client'

/**
 * Midea 配網適配器
 * 使用美的 IoT 平台進行配網
 */
export class MideaProvisioningAdapter extends BaseProvisioningAdapter {
  readonly vendor = 'midea'
  private baseUrl = 'https://mapp.midea.com/mas/v5/app/protocol/json'

  /**
   * 啟動配網流程
   * Midea 支持 AP 模式和藍牙配網
   */
  async startProvisioning(config: ProvisioningConfig): Promise<ProvisioningResult> {
    try {
      if (!config.ssid || !config.password) {
        return {
          success: false,
          error: 'Wi-Fi SSID and password are required for Midea devices',
          status: 'failed',
        }
      }

      const mode = config.mode || 'ap'

      // Try native SDK first (Android/iOS)
      if (canUseNativeMideaProvisioning()) {
        try {
          const nativeResult = await startNativeMideaProvisioning({
            mode: mode as 'ap' | 'ez' | 'bluetooth',
            deviceSsid: config.deviceSsid, // Device's AP SSID (for AP mode)
            ssid: config.ssid,
            password: config.password,
            routerSecurityParams: config.routerSecurityParams,
          })

          if (nativeResult.success) {
            return {
              success: true,
              status: nativeResult.status === 'success' ? 'success' : 'provisioning',
              deviceId: nativeResult.deviceId,
              deviceName: nativeResult.deviceName,
              deviceInfo: nativeResult.deviceInfo,
              token: nativeResult.token,
            }
          } else {
            return {
              success: false,
              error: nativeResult.error || 'Native provisioning failed',
              status: 'failed',
              token: nativeResult.token,
            }
          }
        } catch (nativeError: any) {
          console.error('Native Midea provisioning failed, falling back to API:', nativeError)
          // Fall through to API fallback
        }
      }

      // API fallback (web or if native fails)
      // Note: This requires Midea Cloud API integration
      return {
        success: false,
        error: 'Midea provisioning requires native SDK on mobile devices. Please use Android/iOS app for provisioning.',
        status: 'failed',
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to start Midea provisioning',
        status: 'failed',
      }
    }
  }

  /**
   * 查詢配網狀態
   */
  async queryStatus(token: string): Promise<ProvisioningResult> {
    // Midea 配網狀態查詢
    return {
      success: false,
      error: 'Midea provisioning status query not implemented',
      status: 'failed',
    }
  }

  /**
   * 停止配網流程
   */
  async stopProvisioning(token: string): Promise<boolean> {
    // Midea 配網停止
    return false
  }

  /**
   * 發現設備（藍牙配網）
   */
  async discoverDevices(config: ProvisioningConfig): Promise<ProvisioningResult[]> {
    // Midea 藍牙設備發現
    // 需要藍牙權限和美的 SDK
    return []
  }
}

