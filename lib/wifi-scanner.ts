// WiFi 掃描工具
// 用於掃描可用的 WiFi 網絡
// WiFi Scanner Utility - Scans available WiFi networks

import WiFiPlugin from './plugins/wifi'

/**
 * WiFi 網絡信息
 */
export interface WiFiNetwork {
  ssid: string // 網絡名稱
  bssid?: string // MAC 地址
  signalStrength?: number // 信號強度 (dBm)
  frequency?: number // 頻率 (MHz)
  security?: 'none' | 'wpa' | 'wpa2' | 'wpa3' | 'wep' // 安全類型
  isConnected?: boolean // 是否已連接
  password?: string // 已保存的密碼（僅本地緩存使用）
}

/**
 * WiFi 掃描器類別
 * 注意：瀏覽器環境下無法直接掃描 WiFi
 * 需要通過以下方式之一：
 * 1. 服務器端掃描（通過 ESP 設備 API）
 * 2. 使用 Web Bluetooth API（如果設備支持）
 * 3. 使用本地工具/插件
 * 4. 手動輸入或從設備獲取
 */
export class WiFiScanner {
  /**
   * 從 ESP 設備掃描 WiFi 網絡
   * 當設備處於 AP 模式時，可以通過設備的 API 獲取掃描結果
   */
  static async scanFromESPDevice(deviceIp: string = '192.168.4.1'): Promise<WiFiNetwork[]> {
    try {
      // ESP 設備在 AP 模式下通常提供掃描 API
      // 例如：http://192.168.4.1/api/scan
      const response = await fetch(`http://${deviceIp}/api/scan`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 注意：可能需要處理 CORS
        mode: 'cors',
      })

      if (!response.ok) {
        throw new Error(`Failed to scan WiFi: ${response.statusText}`)
      }

      const data = await response.json()
      
      // 解析 ESP 設備返回的掃描結果
      // 格式可能因設備而異
      if (Array.isArray(data)) {
        return data.map((network: any) => ({
          ssid: network.ssid || network.SSID || '',
          bssid: network.bssid || network.BSSID,
          signalStrength: network.rssi || network.signal || network.signalStrength,
          frequency: network.channel ? (network.channel * 5 + 2400) : network.frequency,
          security: this.parseSecurityType(network.encryption || network.auth || network.security),
          isConnected: network.connected || false,
        }))
      }

      return []
    } catch (error: any) {
      console.error('WiFi scan error:', error)
      // 如果掃描失敗，返回空數組或常用網絡列表
      return []
    }
  }

  /**
   * 透過原生插件掃描（iOS/Android）
   * Scan using native plugin (iOS/Android)
   */
  static async scanNative(): Promise<WiFiNetwork[]> {
    try {
      // 检查是否有原生插件
      const { Capacitor } = await import('@capacitor/core')
      const platform = Capacitor.getPlatform()
      
      if (platform === 'web') {
        // Web 环境不应该调用这个方法
        throw new Error('Native scan is not available on web platform')
      }

      console.log(`[WiFiScanner] Checking permissions for ${platform}`)
      
      // 检查权限
      const permissionResult = await WiFiPlugin.checkPermission()
      if (!permissionResult.granted) {
        console.log('[WiFiScanner] Permission not granted, requesting...')
        const requestResult = await WiFiPlugin.requestPermission()
        if (!requestResult.granted) {
          throw new Error('WiFi 掃描需要位置權限。請在設備設置中授予位置權限。')
        }
      }

      console.log('[WiFiScanner] Permission granted, starting native scan...')
      
      // 执行原生扫描
      const result = await WiFiPlugin.scanNetworks()
      const networks = result.networks || []
      
      console.log(`[WiFiScanner] Native scan completed: found ${networks.length} networks`)
      
      return networks
    } catch (error: any) {
      console.error('[WiFiScanner] Native WiFi scan error:', error)
      // 重新抛出错误，让调用者决定如何处理
      throw error
    }
  }

  /**
   * 透過伺服器端掃描（需要 Node.js 環境支援）
   */
  static async scanFromServer(): Promise<WiFiNetwork[]> {
    try {
      const response = await fetch('/api/mqtt/wifi/scan', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok) {
        // 提供更友好的錯誤訊息
        const errorMsg = data?.error || response.statusText
        const isVercel = data?.requiresLocalEnvironment
        
        if (isVercel) {
          throw new Error('WiFi scanning is not available on Vercel. Please use local environment (npm run dev) or mobile app with native WiFi scanning.')
        }
        
        throw new Error(errorMsg)
      }

      if (data.success && Array.isArray(data.networks)) {
        return data.networks as WiFiNetwork[]
      }

      return []
    } catch (error: any) {
      console.error('Server WiFi scan error:', error)
      // 重新拋出錯誤，讓 UI 可以處理
      throw error
    }
  }

  /**
   * 智能扫描：优先使用原生扫描，失败则回退到服务器扫描
   * Smart scan: prefer native scan, fallback to server scan
   * CRITICAL: On iOS/Android, ALWAYS use native scan first - never fallback to server on Vercel
   */
  static async scan(): Promise<WiFiNetwork[]> {
    try {
      // 检查平台
      const { Capacitor } = await import('@capacitor/core')
      const platform = Capacitor.getPlatform()
      
      // 移动端优先使用原生扫描 - CRITICAL for iOS/Android
      if (platform === 'ios' || platform === 'android') {
        try {
          console.log('[WiFiScanner] CRITICAL: Using native scan on', platform)
          const networks = await this.scanNative()
          if (networks && networks.length > 0) {
            console.log(`[WiFiScanner] Native scan successful: found ${networks.length} networks`)
            return networks
          }
          // Even if empty, return empty array - don't fallback to server on mobile
          console.log('[WiFiScanner] Native scan returned empty array (no networks found)')
          return []
        } catch (nativeError: any) {
          console.error('[WiFiScanner] Native scan failed:', nativeError.message)
          // 如果是权限错误，直接抛出，不要回退到服务器
          if (nativeError.message?.includes('permission') || nativeError.message?.includes('denied') || nativeError.message?.includes('權限')) {
            throw new Error('WiFi 掃描需要位置權限。請在設備設置中授予位置權限。')
          }
          // On mobile, don't fallback to server - throw error
          throw new Error(`原生 WiFi 掃描失敗: ${nativeError.message || '未知錯誤'}`)
        }
      }
      
      // Web 环境才使用服务器扫描
      console.log('[WiFiScanner] Web platform detected, attempting server scan')
      try {
        return await this.scanFromServer()
      } catch (serverError: any) {
        // 如果服务器扫描也失败，尝试加载已保存的网络
        console.warn('[WiFiScanner] Server scan failed, loading saved networks')
        const saved = await this.getSavedNetworks()
        if (saved.length > 0) {
          console.log(`[WiFiScanner] Loaded ${saved.length} saved networks`)
          return saved
        }
        // 如果都没有，抛出错误
        throw serverError
      }
    } catch (error: any) {
      console.error('[WiFiScanner] All scan methods failed:', error)
      throw error
    }
  }

  /**
   * 從本地存儲獲取已保存的 WiFi 網絡列表
   */
  static async getSavedNetworks(): Promise<WiFiNetwork[]> {
    try {
      // 优先从原生 Keychain/Keystore 获取
      const { Capacitor } = await import('@capacitor/core')
      if (Capacitor.getPlatform() !== 'web') {
        try {
          const result = await WiFiPlugin.getSavedSSIDs()
          const networks: WiFiNetwork[] = []
          
          // 获取每个 SSID 的密码
          for (const ssid of result.ssids) {
            const passwordResult = await WiFiPlugin.getPassword({ ssid })
            networks.push({
              ssid,
              password: passwordResult.password || undefined,
            })
          }
          
          return networks
        } catch (nativeError) {
          console.warn('Failed to get saved networks from native storage:', nativeError)
        }
      }
      
      // 回退到 localStorage
      const saved = localStorage.getItem('saved_wifi_networks')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load saved networks:', error)
    }
    return []
  }

  /**
   * 保存 WiFi 網絡（优先使用原生 Keychain/Keystore）
   */
  static async saveNetwork(network: WiFiNetwork, password?: string): Promise<void> {
    try {
      // 优先保存到原生 Keychain/Keystore
      const { Capacitor } = await import('@capacitor/core')
      if (Capacitor.getPlatform() !== 'web' && password) {
        try {
          await WiFiPlugin.savePassword({ ssid: network.ssid, password })
          console.log('✅ WiFi password saved to native Keychain/Keystore')
        } catch (nativeError) {
          console.warn('Failed to save password to native storage:', nativeError)
        }
      }
      
      // 同时保存到 localStorage（作为备份）
      const saved = await this.getSavedNetworksFromLocalStorage()
      const existingIndex = saved.findIndex(n => n.ssid === network.ssid)
      
      const networkToSave = {
        ...network,
        password: password, // 注意：Web 环境存储在 localStorage
      }

      if (existingIndex >= 0) {
        saved[existingIndex] = networkToSave
      } else {
        saved.push(networkToSave)
      }

      localStorage.setItem('saved_wifi_networks', JSON.stringify(saved))
    } catch (error) {
      console.error('Failed to save network:', error)
    }
  }

  /**
   * 獲取已保存的 WiFi 密碼（优先从原生 Keychain/Keystore）
   */
  static async getSavedPassword(ssid: string): Promise<string | null> {
    try {
      // 优先从原生 Keychain/Keystore 获取
      const { Capacitor } = await import('@capacitor/core')
      if (Capacitor.getPlatform() !== 'web') {
        try {
          const result = await WiFiPlugin.getPassword({ ssid })
          if (result.password) {
            return result.password
          }
        } catch (nativeError) {
          console.warn('Failed to get password from native storage:', nativeError)
        }
      }
      
      // 回退到 localStorage
      const saved = await this.getSavedNetworksFromLocalStorage()
      const network = saved.find(n => n.ssid === ssid)
      return network?.password || null
    } catch (error) {
      console.error('Failed to get saved password:', error)
      return null
    }
  }

  /**
   * 从 localStorage 获取已保存的网络（内部方法）
   */
  private static getSavedNetworksFromLocalStorage(): WiFiNetwork[] {
    try {
      const saved = localStorage.getItem('saved_wifi_networks')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load saved networks from localStorage:', error)
    }
    return []
  }

  /**
   * 清除已保存的 WiFi 網絡
   */
  static clearSavedNetworks(): void {
    try {
      localStorage.removeItem('saved_wifi_networks')
    } catch (error) {
      console.error('Failed to clear saved networks:', error)
    }
  }

  /**
   * 解析安全類型
   */
  private static parseSecurityType(encryption?: string): 'none' | 'wpa' | 'wpa2' | 'wpa3' | 'wep' {
    if (!encryption) return 'none'
    
    const enc = encryption.toLowerCase()
    if (enc.includes('wpa3')) return 'wpa3'
    if (enc.includes('wpa2')) return 'wpa2'
    if (enc.includes('wpa')) return 'wpa'
    if (enc.includes('wep')) return 'wep'
    
    return 'none'
  }

  /**
   * 合併掃描結果和已保存的網絡
   */
  static mergeNetworks(scanned: WiFiNetwork[], saved: WiFiNetwork[]): WiFiNetwork[] {
    const merged: WiFiNetwork[] = []
    const seen = new Set<string>()

    // 先添加掃描到的網絡
    scanned.forEach(network => {
      if (network.ssid && !seen.has(network.ssid)) {
        seen.add(network.ssid)
        merged.push(network)
      }
    })

    // 再添加已保存但未掃描到的網絡
    saved.forEach(network => {
      if (network.ssid && !seen.has(network.ssid)) {
        seen.add(network.ssid)
        merged.push({
          ...network,
          signalStrength: undefined, // 已保存的網絡可能沒有信號強度
        })
      }
    })

    // 按信號強度排序（強到弱）
    return merged.sort((a, b) => {
      if (a.signalStrength && b.signalStrength) {
        return b.signalStrength - a.signalStrength
      }
      if (a.signalStrength) return -1
      if (b.signalStrength) return 1
      return 0
    })
  }
}

