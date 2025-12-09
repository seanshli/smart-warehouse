// Home Assistant 配網適配器
// 用於添加 Home Assistant 設備到系統

import { BaseProvisioningAdapter, ProvisioningConfig, ProvisioningResult } from './base-provisioning'
import { getHomeAssistantStates, type HomeAssistantState } from '../homeassistant'

export class HomeAssistantProvisioningAdapter extends BaseProvisioningAdapter {
  readonly vendor = 'homeassistant'
  readonly supportedModes = ['manual'] as const

  /**
   * 開始配網流程
   * 對於 Home Assistant，這意味著驗證實體 ID 並獲取設備信息
   */
  async startProvisioning(config: ProvisioningConfig): Promise<ProvisioningResult> {
    const { deviceId, baseUrl, accessToken } = config

    if (!deviceId) {
      return {
        success: false,
        status: 'failed',
        error: 'Entity ID is required',
      }
    }

    try {
      // 驗證實體 ID 格式（domain.entity_name）
      if (!deviceId.includes('.')) {
        return {
          success: false,
          status: 'failed',
          error: 'Invalid entity ID format. Expected format: domain.entity_name (e.g., light.living_room)',
        }
      }

      // 如果提供了 baseUrl 或 accessToken，臨時設置環境變數
      const originalBaseUrl = process.env.HOME_ASSISTANT_BASE_URL
      const originalToken = process.env.HOME_ASSISTANT_ACCESS_TOKEN

      if (baseUrl) {
        process.env.HOME_ASSISTANT_BASE_URL = baseUrl
      }
      if (accessToken) {
        process.env.HOME_ASSISTANT_ACCESS_TOKEN = accessToken
      }

      try {
        // 使用 callHomeAssistant 直接調用 API，傳遞臨時配置
        const { callHomeAssistant, type HomeAssistantState } = await import('../homeassistant')
        
        // 構建臨時配置對象
        const tempConfig = {
          baseUrl: baseUrl || process.env.HOME_ASSISTANT_BASE_URL || '',
          accessToken: accessToken || process.env.HOME_ASSISTANT_ACCESS_TOKEN || '',
        }

        if (!tempConfig.baseUrl || !tempConfig.accessToken) {
          return {
            success: false,
            status: 'failed',
            error: 'Home Assistant Base URL and Access Token are required',
          }
        }

        // 臨時覆蓋環境變數以確保 callHomeAssistant 使用正確的配置
        if (baseUrl) {
          process.env.HOME_ASSISTANT_BASE_URL = baseUrl
        }
        if (accessToken) {
          process.env.HOME_ASSISTANT_ACCESS_TOKEN = accessToken
        }

        try {
          // 嘗試獲取實體狀態以驗證實體存在
          const entity = await callHomeAssistant<HomeAssistantState>(
            `/api/states/${deviceId}`,
            {},
            null // 不使用 householdId，因為我們已經設置了環境變數
          )

          const deviceName = entity.attributes?.friendly_name || deviceId

          return {
            success: true,
            status: 'success',
            deviceId,
            deviceName,
            deviceInfo: {
              entityId: deviceId,
              state: entity.state,
              attributes: entity.attributes,
              domain: deviceId.split('.')[0],
              baseUrl: tempConfig.baseUrl,
              accessToken: tempConfig.accessToken,
            },
          }
        } catch (apiError: any) {
          // 如果實體不存在，API 會返回 404
          if (apiError.message?.includes('404') || apiError.message?.includes('not found')) {
            return {
              success: false,
              status: 'failed',
              error: `Entity ${deviceId} not found in Home Assistant`,
            }
          }
          throw apiError
        }
      } finally {
        // 恢復原始環境變數
        if (baseUrl) {
          process.env.HOME_ASSISTANT_BASE_URL = originalBaseUrl
        }
        if (accessToken) {
          process.env.HOME_ASSISTANT_ACCESS_TOKEN = originalToken
        }
      }
    } catch (error: any) {
      console.error('Home Assistant provisioning error:', error)
      return {
        success: false,
        status: 'failed',
        error: error.message || 'Failed to connect to Home Assistant',
      }
    }
  }

  /**
   * 查詢配網狀態
   * 對於 Home Assistant，配網是即時的，所以直接返回成功
   */
  async queryStatus(token: string): Promise<ProvisioningResult> {
    // Home Assistant 配網是即時的，不需要輪詢
    return {
      success: true,
      status: 'success',
      deviceId: token, // token 就是 deviceId
    }
  }

  /**
   * 停止配網
   * Home Assistant 不需要停止配網
   */
  async stopProvisioning(): Promise<boolean> {
    // 無需操作
    return true
  }

  /**
   * 發現設備
   * 獲取所有 Home Assistant 實體
   */
  async discoverDevices(options?: {
    baseUrl?: string
    accessToken?: string
    domain?: string // 可選：只獲取特定領域的實體（如 'light', 'switch'）
  }): Promise<ProvisioningResult[]> {
    const { baseUrl, accessToken, domain } = options || {}

    try {
      // 如果提供了 baseUrl 或 accessToken，臨時設置環境變數
      const originalBaseUrl = process.env.HOME_ASSISTANT_BASE_URL
      const originalToken = process.env.HOME_ASSISTANT_ACCESS_TOKEN

      if (baseUrl) {
        process.env.HOME_ASSISTANT_BASE_URL = baseUrl
      }
      if (accessToken) {
        process.env.HOME_ASSISTANT_ACCESS_TOKEN = accessToken
      }

      try {
        // 獲取所有實體
        const states = await getHomeAssistantStates()

        // 如果指定了 domain，過濾實體
        const filteredStates = domain
          ? states.filter((state: HomeAssistantState) => state.entity_id.startsWith(`${domain}.`))
          : states

        return filteredStates.map((state: HomeAssistantState) => ({
          success: true,
          status: 'success',
          deviceId: state.entity_id,
          deviceName: state.attributes?.friendly_name || state.entity_id,
          deviceInfo: {
            entityId: state.entity_id,
            state: state.state,
            attributes: state.attributes,
            domain: state.entity_id.split('.')[0],
          },
        }))
      } finally {
        // 恢復原始環境變數
        if (baseUrl) {
          process.env.HOME_ASSISTANT_BASE_URL = originalBaseUrl
        }
        if (accessToken) {
          process.env.HOME_ASSISTANT_ACCESS_TOKEN = originalToken
        }
      }
    } catch (error: any) {
      console.error('Home Assistant discovery error:', error)
      return [
        {
          success: false,
          status: 'failed',
          error: error.message || 'Failed to fetch Home Assistant entities',
        },
      ]
    }
  }
}


