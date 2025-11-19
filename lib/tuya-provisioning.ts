// Tuya 配網（Provisioning）模組
// 處理 Tuya 設備的配網流程，支援 EZ 模式和 AP 模式
// Tuya Provisioning Module - Handles device provisioning flow (EZ Mode and AP Mode)

import crypto from 'crypto'

// Tuya 配網模式
export type TuyaProvisioningMode = 'ez' | 'ap' | 'auto'

// Tuya 配網狀態
export type TuyaProvisioningStatus = 'idle' | 'starting' | 'provisioning' | 'success' | 'failed' | 'timeout'

// Tuya 配網配置
export interface TuyaProvisioningConfig {
  // Tuya API 配置
  accessId: string // Tuya Access ID
  accessSecret: string // Tuya Access Secret
  region?: string // 區域（如：cn, us, eu），預設為 cn
  
  // Wi-Fi 配置
  ssid: string // Wi-Fi SSID
  password: string // Wi-Fi 密碼
  
  // 配網模式
  mode?: TuyaProvisioningMode // 配網模式：ez, ap, auto
  
  // 配網參數
  timeout?: number // 配網超時時間（秒），預設 60 秒
  token?: string // 配網 Token（可選，如果已獲取）
}

// Tuya 配網結果
export interface TuyaProvisioningResult {
  success: boolean
  deviceId?: string // 設備 ID
  deviceName?: string // 設備名稱
  error?: string // 錯誤訊息
  status: TuyaProvisioningStatus
}

/**
 * Tuya 配網類別
 * 處理 Tuya 設備的配網流程
 */
export class TuyaProvisioning {
  private config: TuyaProvisioningConfig
  private baseUrl: string

  constructor(config: TuyaProvisioningConfig) {
    this.config = {
      region: 'cn',
      mode: 'auto',
      timeout: 60,
      ...config
    }
    
    // 根據區域設定 API 基礎 URL
    const regionMap: Record<string, string> = {
      cn: 'https://openapi.tuyacn.com',
      us: 'https://openapi.tuyaus.com',
      eu: 'https://openapi.tuyaeu.com',
      in: 'https://openapi.tuyain.com',
    }
    
    this.baseUrl = regionMap[this.config.region || 'cn']
  }

  /**
   * 生成 Tuya API 簽名
   * Generate Tuya API signature
   */
  private generateSignature(
    method: string,
    path: string,
    headers: Record<string, string>,
    body: string = ''
  ): string {
    const timestamp = Date.now().toString()
    const nonce = crypto.randomBytes(16).toString('hex')
    
    // 構建簽名字符串
    const signStr = [
      this.config.accessId,
      timestamp,
      nonce,
      method,
      path,
      body,
    ].join('\n')
    
    // 使用 HMAC-SHA256 生成簽名
    const sign = crypto
      .createHmac('sha256', this.config.accessSecret)
      .update(signStr)
      .digest('base64')
    
    return sign
  }

  /**
   * 獲取配網 Token
   * Get provisioning token from Tuya Cloud
   */
  async getProvisioningToken(): Promise<string> {
    try {
      const path = '/v1.0/token'
      const method = 'GET'
      const headers: Record<string, string> = {
        'client_id': this.config.accessId,
        't': Date.now().toString(),
        'sign_method': 'HMAC-SHA256',
      }
      
      const sign = this.generateSignature(method, path, headers)
      headers['sign'] = sign
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.result) {
        return data.result.access_token
      }
      
      throw new Error(data.msg || 'Failed to get provisioning token')
    } catch (error: any) {
      console.error('Tuya: Failed to get provisioning token', error)
      throw error
    }
  }

  /**
   * 啟動配網流程
   * Start provisioning process
   */
  async startProvisioning(
    token: string,
    ssid: string,
    password: string,
    mode: TuyaProvisioningMode = 'auto'
  ): Promise<TuyaProvisioningResult> {
    try {
      const path = '/v1.0/devices/token'
      const method = 'POST'
      
      // 構建請求體
      const body = JSON.stringify({
        token,
        ssid,
        password,
        mode, // 'ez' 或 'ap'
      })
      
      const headers: Record<string, string> = {
        'client_id': this.config.accessId,
        't': Date.now().toString(),
        'sign_method': 'HMAC-SHA256',
        'access_token': token,
      }
      
      const sign = this.generateSignature(method, path, headers, body)
      headers['sign'] = sign
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body,
      })
      
      if (!response.ok) {
        throw new Error(`Provisioning failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.result) {
        return {
          success: true,
          deviceId: data.result.device_id,
          deviceName: data.result.name,
          status: 'success',
        }
      }
      
      return {
        success: false,
        error: data.msg || 'Provisioning failed',
        status: 'failed',
      }
    } catch (error: any) {
      console.error('Tuya: Provisioning error', error)
      return {
        success: false,
        error: error.message || 'Provisioning failed',
        status: 'failed',
      }
    }
  }

  /**
   * 停止配網流程
   * Stop provisioning process
   */
  async stopProvisioning(token: string): Promise<boolean> {
    try {
      const path = '/v1.0/devices/token'
      const method = 'DELETE'
      
      const headers: Record<string, string> = {
        'client_id': this.config.accessId,
        't': Date.now().toString(),
        'sign_method': 'HMAC-SHA256',
        'access_token': token,
      }
      
      const sign = this.generateSignature(method, path, headers)
      headers['sign'] = sign
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      })
      
      return response.ok
    } catch (error) {
      console.error('Tuya: Failed to stop provisioning', error)
      return false
    }
  }

  /**
   * 查詢配網狀態
   * Query provisioning status
   */
  async queryProvisioningStatus(token: string): Promise<TuyaProvisioningResult> {
    try {
      const path = '/v1.0/devices/token'
      const method = 'GET'
      
      const headers: Record<string, string> = {
        'client_id': this.config.accessId,
        't': Date.now().toString(),
        'sign_method': 'HMAC-SHA256',
        'access_token': token,
      }
      
      const sign = this.generateSignature(method, path, headers)
      headers['sign'] = sign
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to query status: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.result) {
        return {
          success: true,
          deviceId: data.result.device_id,
          deviceName: data.result.name,
          status: 'success',
        }
      }
      
      return {
        success: false,
        status: 'provisioning', // 仍在配網中
      }
    } catch (error: any) {
      console.error('Tuya: Failed to query provisioning status', error)
      return {
        success: false,
        error: error.message || 'Failed to query status',
        status: 'failed',
      }
    }
  }
}

/**
 * 創建 Tuya 配網實例
 * Create Tuya provisioning instance
 */
export function createTuyaProvisioning(config: TuyaProvisioningConfig): TuyaProvisioning {
  return new TuyaProvisioning(config)
}

