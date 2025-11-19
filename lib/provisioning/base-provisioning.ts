// 統一配網基礎介面
// 為不同品牌的 IoT 設備提供統一的配網介面
// Unified Provisioning Base Interface - Provides unified provisioning interface for different IoT device brands

// 配網模式
export type ProvisioningMode =
  | 'wifi'
  | 'ez'
  | 'hotspot'
  | 'ap'
  | 'wifi/bt'
  | 'zigbee'
  | 'bt'
  | 'manual'
  | 'bluetooth'
  | 'local'
  | 'auto'
  | 'smartconfig'

// 配網狀態
export type ProvisioningStatus = 'idle' | 'starting' | 'discovering' | 'provisioning' | 'pairing' | 'success' | 'failed' | 'timeout'

// 配網配置
export interface ProvisioningConfig {
  // 基本配置
  vendor: 'tuya' | 'midea' | 'philips' | 'panasonic' | 'esp'
  ssid?: string // Wi-Fi SSID（MQTT 設備需要）
  password?: string // Wi-Fi 密碼（MQTT 設備需要）
  mode?: ProvisioningMode // 配網模式
  
  // RESTful API 配置
  baseUrl?: string // API 基礎 URL（RESTful 設備）
  apiKey?: string // API 金鑰
  accessToken?: string // 訪問令牌
  
  // Tuya 特定配置
  deviceId?: string // 手動配網時使用的設備 ID
  zigbeeGatewayId?: string // Zigbee 配網時使用的網關 ID
  bluetoothMac?: string // Bluetooth 配網時使用的 MAC 地址
  
  // 品牌特定配置
  [key: string]: any
}

// 配網結果
export interface ProvisioningResult {
  success: boolean
  deviceId?: string // 設備 ID
  deviceName?: string // 設備名稱
  deviceInfo?: Record<string, any> // 額外設備信息
  error?: string // 錯誤訊息
  status: ProvisioningStatus
}

/**
 * 配網適配器基礎類別
 * 所有品牌的配網適配器都應繼承此類別
 */
export abstract class BaseProvisioningAdapter {
  abstract readonly vendor: string
  
  /**
   * 啟動配網流程
   * Start provisioning process
   */
  abstract startProvisioning(config: ProvisioningConfig): Promise<ProvisioningResult>
  
  /**
   * 查詢配網狀態
   * Query provisioning status
   */
  abstract queryStatus(token: string): Promise<ProvisioningResult>
  
  /**
   * 停止配網流程
   * Stop provisioning process
   */
  abstract stopProvisioning(token: string): Promise<boolean>
  
  /**
   * 發現設備（用於本地網絡發現）
   * Discover devices (for local network discovery)
   */
  async discoverDevices?(config: ProvisioningConfig): Promise<ProvisioningResult[]>
}

