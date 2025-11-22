// WiFi 原生插件接口
// Native WiFi Plugin Interface

import { registerPlugin } from '@capacitor/core'

export interface WiFiNetwork {
  ssid: string
  bssid?: string
  signalStrength?: number // dBm
  frequency?: number // MHz
  security?: 'none' | 'wpa' | 'wpa2' | 'wpa3' | 'wep'
  isConnected?: boolean
}

export interface WiFiPlugin {
  /**
   * 获取当前连接的 WiFi SSID
   * Get current connected WiFi SSID
   */
  getCurrentSSID(): Promise<{ ssid: string | null }>

  /**
   * 扫描可用的 WiFi 网络（需要位置权限）
   * Scan available WiFi networks (requires location permission)
   */
  scanNetworks(): Promise<{ networks: WiFiNetwork[] }>

  /**
   * 检查是否有 WiFi 扫描权限
   * Check if WiFi scan permission is granted
   */
  checkPermission(): Promise<{ granted: boolean }>

  /**
   * 请求 WiFi 扫描权限
   * Request WiFi scan permission
   */
  requestPermission(): Promise<{ granted: boolean }>

  /**
   * 保存 WiFi 密码到系统 Keychain/Keystore
   * Save WiFi password to system Keychain/Keystore
   */
  savePassword(options: { ssid: string; password: string }): Promise<{ success: boolean }>

  /**
   * 从系统 Keychain/Keystore 获取 WiFi 密码
   * Get WiFi password from system Keychain/Keystore
   */
  getPassword(options: { ssid: string }): Promise<{ password: string | null }>

  /**
   * 删除保存的 WiFi 密码
   * Delete saved WiFi password
   */
  deletePassword(options: { ssid: string }): Promise<{ success: boolean }>

  /**
   * 获取所有已保存的 WiFi SSID 列表
   * Get all saved WiFi SSID list
   */
  getSavedSSIDs(): Promise<{ ssids: string[] }>
}

const WiFiPlugin = registerPlugin<WiFiPlugin>('WiFi', {
  web: () => import('./web').then(m => new m.WiFiWeb()),
})

export default WiFiPlugin

