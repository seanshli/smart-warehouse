// WiFi 掃描工具
// 用於掃描可用的 WiFi 網絡
// WiFi Scanner Utility - Scans available WiFi networks

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
   * 從本地存儲獲取已保存的 WiFi 網絡列表
   */
  static getSavedNetworks(): WiFiNetwork[] {
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

  /**
   * 保存 WiFi 網絡到本地存儲
   */
  static saveNetwork(network: WiFiNetwork, password?: string): void {
    try {
      const saved = this.getSavedNetworks()
      const existingIndex = saved.findIndex(n => n.ssid === network.ssid)
      
      const networkToSave = {
        ...network,
        password: password, // 注意：密碼存儲在內存中，不建議長期存儲
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
   * 獲取已保存的 WiFi 密碼
   */
  static getSavedPassword(ssid: string): string | null {
    try {
      const saved = this.getSavedNetworks()
      const network = saved.find(n => n.ssid === ssid)
      return network?.password || null
    } catch (error) {
      console.error('Failed to get saved password:', error)
      return null
    }
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

