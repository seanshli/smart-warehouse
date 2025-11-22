// WiFi 插件 Web 实现（回退到 localStorage）
// WiFi Plugin Web Implementation (fallback to localStorage)

import type { WiFiNetwork, WiFiPlugin } from './index'

export class WiFiWeb implements WiFiPlugin {
  async getCurrentSSID(): Promise<{ ssid: string | null }> {
    // Web 环境无法获取当前 SSID
    return { ssid: null }
  }

  async scanNetworks(): Promise<{ networks: WiFiNetwork[] }> {
    // Web 环境无法扫描 WiFi，返回空数组
    console.warn('WiFi scanning is not available on web. Please use native app or server-side scanning.')
    return { networks: [] }
  }

  async checkPermission(): Promise<{ granted: boolean }> {
    // Web 环境总是返回 false
    return { granted: false }
  }

  async requestPermission(): Promise<{ granted: boolean }> {
    // Web 环境无法请求权限
    return { granted: false }
  }

  async savePassword(options: { ssid: string; password: string }): Promise<{ success: boolean }> {
    try {
      // 使用 localStorage 作为回退
      const saved = this.getSavedNetworks()
      const existingIndex = saved.findIndex(n => n.ssid === options.ssid)
      
      const networkToSave = {
        ssid: options.ssid,
        password: options.password,
      }

      if (existingIndex >= 0) {
        saved[existingIndex] = networkToSave
      } else {
        saved.push(networkToSave)
      }

      localStorage.setItem('saved_wifi_networks', JSON.stringify(saved))
      return { success: true }
    } catch (error) {
      console.error('Failed to save WiFi password:', error)
      return { success: false }
    }
  }

  async getPassword(options: { ssid: string }): Promise<{ password: string | null }> {
    try {
      const saved = this.getSavedNetworks()
      const network = saved.find(n => n.ssid === options.ssid)
      return { password: network?.password || null }
    } catch (error) {
      console.error('Failed to get WiFi password:', error)
      return { password: null }
    }
  }

  async deletePassword(options: { ssid: string }): Promise<{ success: boolean }> {
    try {
      const saved = this.getSavedNetworks()
      const filtered = saved.filter(n => n.ssid !== options.ssid)
      localStorage.setItem('saved_wifi_networks', JSON.stringify(filtered))
      return { success: true }
    } catch (error) {
      console.error('Failed to delete WiFi password:', error)
      return { success: false }
    }
  }

  async getSavedSSIDs(): Promise<{ ssids: string[] }> {
    try {
      const saved = this.getSavedNetworks()
      return { ssids: saved.map(n => n.ssid) }
    } catch (error) {
      console.error('Failed to get saved SSIDs:', error)
      return { ssids: [] }
    }
  }

  private getSavedNetworks(): Array<{ ssid: string; password?: string }> {
    try {
      const saved = localStorage.getItem('saved_wifi_networks')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load saved networks:', error)
    }
    return []
  }
}

