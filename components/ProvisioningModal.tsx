'use client'
// 統一配網模態框組件
// 支持所有品牌的 IoT 設備配網
// Unified Provisioning Modal Component - Supports provisioning for all IoT device brands

import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  WifiIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'
import { WiFiScanner, type WiFiNetwork } from '@/lib/wifi-scanner'

// 配網狀態
type ProvisioningStatus = 'idle' | 'starting' | 'discovering' | 'provisioning' | 'pairing' | 'success' | 'failed' | 'timeout'

// 支持的品牌
type SupportedVendor = 'tuya' | 'midea' | 'philips' | 'panasonic' | 'esp'

interface ProvisioningModalProps {
  isOpen: boolean
  onClose: () => void
  vendor?: SupportedVendor
  onSuccess?: (deviceId: string, deviceName: string, vendor: SupportedVendor, deviceInfo?: any) => void
}

export default function ProvisioningModal({
  isOpen,
  onClose,
  vendor: initialVendor,
  onSuccess,
}: ProvisioningModalProps) {
  const { t } = useLanguage()
  const [vendor, setVendor] = useState<SupportedVendor>(initialVendor || 'tuya')
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'wifi' | 'ez' | 'hotspot' | 'ap' | 'wifi/bt' | 'zigbee' | 'bt' | 'manual' | 'auto' | 'smartconfig'>('auto')
  const [deviceId, setDeviceId] = useState<string>('') // 手動配網時使用
  const [zigbeeGatewayId, setZigbeeGatewayId] = useState<string>('') // Zigbee 配網時使用
  const [bluetoothMac, setBluetoothMac] = useState<string>('') // Bluetooth 配網時使用
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [status, setStatus] = useState<ProvisioningStatus>('idle')
  const [token, setToken] = useState<string | null>(null)
  const [provisionedDeviceId, setProvisionedDeviceId] = useState<string | null>(null)
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  
  // ESP 配網多步驟狀態
  const [espStep, setEspStep] = useState<'connect' | 'configure'>('connect') // ESP AP 模式步驟
  const [espHotspotPassword, setEspHotspotPassword] = useState<string>('') // ESP 設備熱點密碼（可選）
  const [wifiNetworks, setWifiNetworks] = useState<WiFiNetwork[]>([]) // 掃描到的 WiFi 網絡
  const [isScanningWifi, setIsScanningWifi] = useState(false) // 是否正在掃描 WiFi
  const [selectedNetwork, setSelectedNetwork] = useState<WiFiNetwork | null>(null) // 選中的 WiFi 網絡

  // 清理輪詢
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // 發現設備（Philips 和 Panasonic）
  const handleDiscoverDevices = async () => {
    if (vendor !== 'philips' && vendor !== 'panasonic') {
      return
    }

    setIsDiscovering(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        vendor,
        action: 'discover',
      })

      if (baseUrl) params.append('baseUrl', baseUrl)
      if (apiKey) params.append('apiKey', apiKey)
      if (accessToken) params.append('accessToken', accessToken)

      const response = await fetch(`/api/provisioning?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success && data.devices) {
        setDiscoveredDevices(data.devices)
        if (data.devices.length > 0) {
          toast.success(`發現 ${data.devices.length} 個設備`)
        } else {
          toast.error('未發現設備')
        }
      } else {
        toast.error(data.error || '設備發現失敗')
      }
    } catch (error: any) {
      toast.error(error.message || '設備發現失敗')
    } finally {
      setIsDiscovering(false)
    }
  }

  // 啟動配網流程
  const handleStartProvisioning = async () => {
    // ESP AP 模式需要完成配置步驟
    if (vendor === 'esp' && mode === 'ap' && espStep === 'connect') {
      toast.error('請先完成設備熱點連接步驟')
      return
    }

    // 驗證必填欄位
    if (vendor === 'tuya') {
      // Tuya 手動配網只需要設備 ID
      if (mode === 'manual') {
        if (!deviceId) {
          toast.error('設備 ID 為必填項')
          return
        }
      }
      // Tuya Zigbee 配網需要網關 ID
      else if (mode === 'zigbee') {
        if (!zigbeeGatewayId) {
          toast.error('Zigbee 網關 ID 為必填項')
          return
        }
      }
      // Tuya Bluetooth 配網需要 MAC 地址
      else if (mode === 'bt') {
        if (!bluetoothMac) {
          toast.error('Bluetooth MAC 地址為必填項')
          return
        }
      }
      // 其他模式需要 Wi-Fi 信息
      else if (mode !== 'manual' && mode !== 'zigbee' && mode !== 'bt') {
        if (!ssid || !password) {
          toast.error('Wi-Fi SSID 和密碼為必填項')
          return
        }
      }
    } else if (vendor === 'midea' || vendor === 'esp') {
      if (!ssid || !password) {
        toast.error('Wi-Fi SSID 和密碼為必填項')
        return
      }
    } else if (vendor === 'philips' || vendor === 'panasonic') {
      if (!baseUrl || !apiKey) {
        toast.error('Base URL 和 API Key 為必填項')
        return
      }
    }

    setStatus('starting')
    setError(null)

    try {
      const response = await fetch('/api/provisioning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          vendor,
          ssid,
          password,
          mode: vendor === 'esp' && mode === 'auto' ? 'smartconfig' : mode,
          baseUrl,
          apiKey,
          accessToken,
          // Tuya 特定參數
          deviceId: vendor === 'tuya' && mode === 'manual' ? deviceId : undefined,
          zigbeeGatewayId: vendor === 'tuya' && mode === 'zigbee' ? zigbeeGatewayId : undefined,
          bluetoothMac: vendor === 'tuya' && (mode === 'bt' || mode === 'wifi/bt') ? bluetoothMac : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setToken(data.token)
        setProvisionedDeviceId(data.deviceId)
        setDeviceName(data.deviceName)
        setDeviceInfo(data.deviceInfo)
        
        if (vendor === 'philips' || vendor === 'panasonic') {
          // RESTful 設備配網通常是即時的
          setStatus('success')
          toast.success('配網成功！')
          
          if (onSuccess && data.deviceId) {
            onSuccess(data.deviceId, data.deviceName || `Device ${data.deviceId}`, vendor, data.deviceInfo)
          }
        } else if (vendor === 'esp') {
          // ESP 設備配網需要特殊處理
          // SmartConfig 和 AP 模式都需要用戶手動操作
          setStatus('provisioning')
          toast('請按照設備說明進行配網操作', { icon: 'ℹ️' })
          
          // ESP 配網通常需要用戶手動操作，不進行自動輪詢
          // 用戶完成配網後，可以手動添加設備
        } else {
          // MQTT 設備需要輪詢狀態
          setStatus('provisioning')
          
          const interval = setInterval(async () => {
            await checkProvisioningStatus(data.token)
          }, 2000)
          
          setPollingInterval(interval)

          // 設定超時（60 秒）
          setTimeout(() => {
            if (status === 'provisioning') {
              handleStopProvisioning()
              setStatus('timeout')
              setError('配網超時，請檢查設備是否已進入配網模式')
            }
          }, 60000)
        }
      } else {
        setStatus('failed')
        setError(data.error || '配網啟動失敗')
        toast.error(data.error || '配網啟動失敗')
      }
    } catch (error: any) {
      setStatus('failed')
      setError(error.message || '配網啟動失敗')
      toast.error(error.message || '配網啟動失敗')
    }
  }

  // 查詢配網狀態
  const checkProvisioningStatus = async (provisioningToken: string) => {
    try {
      const response = await fetch(`/api/provisioning?vendor=${vendor}&token=${provisioningToken}`, {
        method: 'GET',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success && data.deviceId) {
        setStatus('success')
        setProvisionedDeviceId(data.deviceId)
        setDeviceName(data.deviceName || `Device ${data.deviceId}`)
        setDeviceInfo(data.deviceInfo)
        
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }

        toast.success('配網成功！')
        
        if (onSuccess && data.deviceId) {
          onSuccess(data.deviceId, data.deviceName || `Device ${data.deviceId}`, vendor, data.deviceInfo)
        }
      } else if (data.status === 'failed') {
        setStatus('failed')
        setError(data.error || '配網失敗')
        
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }
      }
    } catch (error: any) {
      console.error('Failed to check provisioning status:', error)
    }
  }

  // 停止配網流程
  const handleStopProvisioning = async () => {
    if (token) {
      try {
        await fetch(`/api/provisioning?vendor=${vendor}&token=${token}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      } catch (error) {
        console.error('Failed to stop provisioning:', error)
      }
    }

    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }

    setStatus('idle')
    setToken(null)
  }

  // 重置表單
  const handleReset = () => {
    setSsid('')
    setPassword('')
    setMode('auto')
    setBaseUrl('')
    setApiKey('')
    setAccessToken('')
    setStatus('idle')
    setToken(null)
    setDeviceId('')
    setProvisionedDeviceId(null)
    setDeviceName(null)
    setDeviceInfo(null)
    setError(null)
    setDiscoveredDevices([])
    setZigbeeGatewayId('')
    setBluetoothMac('')
    // ESP 配網狀態重置
    setEspStep('connect')
    setEspHotspotPassword('')
    setWifiNetworks([])
    setSelectedNetwork(null)
    handleStopProvisioning()
  }

  // 關閉模態框
  const handleClose = () => {
    handleStopProvisioning()
    handleReset()
    onClose()
  }

  // 選擇發現的設備
  const handleSelectDevice = (device: any) => {
    setProvisionedDeviceId(device.deviceId)
    setDeviceName(device.deviceName)
    setDeviceInfo(device.deviceInfo)
    setStatus('success')
    
    if (onSuccess && device.deviceId) {
      onSuccess(device.deviceId, device.deviceName, vendor, device.deviceInfo)
    }
  }

  if (!isOpen) return null

  const isMQTTDevice = vendor === 'tuya' || vendor === 'midea' || vendor === 'esp'
  const isRESTfulDevice = vendor === 'philips' || vendor === 'panasonic'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* 標題 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {vendor === 'tuya' && 'Tuya 設備配網'}
            {vendor === 'midea' && 'Midea 設備配網'}
            {vendor === 'esp' && 'ESP 設備配網'}
            {vendor === 'philips' && 'Philips Hue 配網'}
            {vendor === 'panasonic' && 'Panasonic 設備配網'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 配網狀態指示 */}
        {status !== 'idle' && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2">
              {status === 'starting' && (
                <>
                  <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />
                  <span className="text-sm text-gray-700">正在啟動配網...</span>
                </>
              )}
              {status === 'discovering' && (
                <>
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-500 animate-spin" />
                  <span className="text-sm text-gray-700">正在發現設備...</span>
                </>
              )}
              {status === 'provisioning' && (
                <>
                  <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />
                  <span className="text-sm text-gray-700">配網中，請確保設備已進入配網模式...</span>
                </>
              )}
              {status === 'pairing' && (
                <>
                  <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />
                  <span className="text-sm text-gray-700">配對中，請按下設備上的配對按鈕...</span>
                </>
              )}
              {status === 'success' && (
                <>
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-700">
                    配網成功！設備 ID: {provisionedDeviceId}
                  </span>
                </>
              )}
              {status === 'failed' && (
                <>
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-gray-700">
                    配網失敗: {error || '未知錯誤'}
                  </span>
                </>
              )}
              {status === 'timeout' && (
                <>
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-gray-700">配網超時</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* 表單 */}
        {status === 'idle' || status === 'failed' || status === 'timeout' ? (
          <div className="space-y-4">
            {/* 品牌選擇（如果未指定） */}
            {!initialVendor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  設備品牌 <span className="text-red-500">*</span>
                </label>
                <select
                  value={vendor}
                  onChange={(e) => {
                    setVendor(e.target.value as SupportedVendor)
                    handleReset()
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tuya">Tuya（塗鴉）</option>
                  <option value="midea">Midea（美的）</option>
                  <option value="esp">ESP (ESP32/ESP8266)</option>
                  <option value="philips">Philips Hue</option>
                  <option value="panasonic">Panasonic（松下）</option>
                </select>
              </div>
            )}

            {/* MQTT 設備配置（Tuya, Midea, ESP SmartConfig） */}
            {isMQTTDevice && vendor !== 'esp' && (
              <>
                {/* WiFi 掃描按鈕（適用於所有 MQTT 設備） */}
                <div>
                  <button
                    onClick={async () => {
                      setIsScanningWifi(true)
                      try {
                        // 嘗試從已保存的網絡獲取
                        const saved = WiFiScanner.getSavedNetworks()
                        const mock = WiFiScanner.getMockNetworks()
                        const merged = WiFiScanner.mergeNetworks(mock, saved)
                        setWifiNetworks(merged)
                        if (merged.length > 0) {
                          toast.success(`發現 ${merged.length} 個 WiFi 網絡`)
                        }
                      } catch (error: any) {
                        console.error('WiFi scan error:', error)
                        toast.error('無法掃描 WiFi 網絡')
                      } finally {
                        setIsScanningWifi(false)
                      }
                    }}
                    disabled={isScanningWifi || status !== 'idle'}
                    className="w-full mb-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>{isScanningWifi ? '掃描中...' : '掃描 WiFi 網絡'}</span>
                  </button>
                </div>

                {/* WiFi 網絡列表（如果已掃描） */}
                {wifiNetworks.length > 0 && (
                  <div className="mb-3 max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                    {wifiNetworks.map((network, index) => {
                      const savedPassword = WiFiScanner.getSavedPassword(network.ssid)
                      const isSelected = selectedNetwork?.ssid === network.ssid
                      
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedNetwork(network)
                            setSsid(network.ssid)
                            if (savedPassword) {
                              setPassword(savedPassword)
                              toast('已自動填充保存的密碼', { icon: '✓' })
                            }
                          }}
                          className={`w-full text-left p-3 border-b border-gray-200 hover:bg-gray-50 ${
                            isSelected ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <WifiIcon className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-sm">{network.ssid}</span>
                              </div>
                              <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                                {network.signalStrength && (
                                  <span>信號: {network.signalStrength} dBm</span>
                                )}
                                {network.security && network.security !== 'none' && (
                                  <span className="text-orange-600">
                                    {network.security.toUpperCase()}
                                  </span>
                                )}
                                {savedPassword && (
                                  <span className="text-green-600">已保存密碼</span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wi-Fi SSID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ssid}
                    onChange={(e) => {
                      setSsid(e.target.value)
                      // 檢查是否有保存的密碼
                      const saved = WiFiScanner.getSavedPassword(e.target.value)
                      if (saved) {
                        setPassword(saved)
                        toast('已自動填充保存的密碼', { icon: '✓' })
                      }
                    }}
                    placeholder="輸入或選擇 Wi-Fi 網絡名稱"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={status !== 'idle'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wi-Fi 密碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="輸入 Wi-Fi 密碼"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={status !== 'idle'}
                  />
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember-wifi-password"
                      defaultChecked={true}
                      onChange={(e) => {
                        if (e.target.checked && ssid && password) {
                          WiFiScanner.saveNetwork(
                            { ssid, security: 'wpa2' },
                            password
                          )
                          toast('已保存 WiFi 密碼', { icon: '✓' })
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="remember-wifi-password" className="text-xs text-gray-600">
                      記住此 WiFi 密碼
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* ESP SmartConfig 模式也需要 WiFi 選擇 */}
            {vendor === 'esp' && mode === 'smartconfig' && (
              <>
                {/* WiFi 掃描按鈕 */}
                <div>
                  <button
                    onClick={async () => {
                      setIsScanningWifi(true)
                      try {
                        const saved = WiFiScanner.getSavedNetworks()
                        const mock = WiFiScanner.getMockNetworks()
                        const merged = WiFiScanner.mergeNetworks(mock, saved)
                        setWifiNetworks(merged)
                        if (merged.length > 0) {
                          toast.success(`發現 ${merged.length} 個 WiFi 網絡`)
                        }
                      } catch (error: any) {
                        console.error('WiFi scan error:', error)
                        toast.error('無法掃描 WiFi 網絡')
                      } finally {
                        setIsScanningWifi(false)
                      }
                    }}
                    disabled={isScanningWifi || status !== 'idle'}
                    className="w-full mb-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>{isScanningWifi ? '掃描中...' : '掃描 WiFi 網絡'}</span>
                  </button>
                </div>

                {/* WiFi 網絡列表 */}
                {wifiNetworks.length > 0 && (
                  <div className="mb-3 max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                    {wifiNetworks.map((network, index) => {
                      const savedPassword = WiFiScanner.getSavedPassword(network.ssid)
                      const isSelected = selectedNetwork?.ssid === network.ssid
                      
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedNetwork(network)
                            setSsid(network.ssid)
                            if (savedPassword) {
                              setPassword(savedPassword)
                              toast('已自動填充保存的密碼', { icon: '✓' })
                            }
                          }}
                          className={`w-full text-left p-3 border-b border-gray-200 hover:bg-gray-50 ${
                            isSelected ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <WifiIcon className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-sm">{network.ssid}</span>
                              </div>
                              <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                                {network.signalStrength && (
                                  <span>信號: {network.signalStrength} dBm</span>
                                )}
                                {network.security && network.security !== 'none' && (
                                  <span className="text-orange-600">
                                    {network.security.toUpperCase()}
                                  </span>
                                )}
                                {savedPassword && (
                                  <span className="text-green-600">已保存密碼</span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wi-Fi SSID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ssid}
                    onChange={(e) => {
                      setSsid(e.target.value)
                      const saved = WiFiScanner.getSavedPassword(e.target.value)
                      if (saved) {
                        setPassword(saved)
                        toast('已自動填充保存的密碼', { icon: '✓' })
                      }
                    }}
                    placeholder="輸入或選擇 Wi-Fi 網絡名稱"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={status !== 'idle'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wi-Fi 密碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="輸入 Wi-Fi 密碼"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={status !== 'idle'}
                  />
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember-esp-password"
                      defaultChecked={true}
                      onChange={(e) => {
                        if (e.target.checked && ssid && password) {
                          WiFiScanner.saveNetwork(
                            { ssid, security: 'wpa2' },
                            password
                          )
                          toast('已保存 WiFi 密碼', { icon: '✓' })
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="remember-esp-password" className="text-xs text-gray-600">
                      記住此 WiFi 密碼
                    </label>
                  </div>
                </div>
              </>
            )}

                {vendor === 'tuya' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        配網模式 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={mode}
                        onChange={(e) => {
                          const newMode = e.target.value as typeof mode
                          setMode(newMode)
                          // 重置模式相關字段
                          if (newMode !== 'manual') setDeviceId('')
                          if (newMode !== 'zigbee') setZigbeeGatewayId('')
                          if (newMode !== 'bt' && newMode !== 'wifi/bt') setBluetoothMac('')
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={status !== 'idle'}
                      >
                        <option value="auto">自動選擇（推薦）</option>
                        <option value="wifi">WiFi 配網（EZ模式）</option>
                        <option value="hotspot">Hotspot 配網（AP模式）</option>
                        <option value="wifi/bt">WiFi/BT 混合配網</option>
                        <option value="zigbee">Zigbee 配網</option>
                        <option value="bt">Bluetooth 配網</option>
                        <option value="manual">手動配網</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        {mode === 'wifi' || mode === 'ez' ? '設備指示燈快速閃爍時使用' : ''}
                        {mode === 'hotspot' || mode === 'ap' ? '設備指示燈慢速閃爍時使用，連接設備熱點進行配置' : ''}
                        {mode === 'wifi/bt' ? '同時使用 WiFi 和 Bluetooth 進行配網' : ''}
                        {mode === 'zigbee' ? '通過 Zigbee 網關進行配網' : ''}
                        {mode === 'bt' ? '通過 Bluetooth 進行配網' : ''}
                        {mode === 'manual' ? '手動輸入設備 ID 進行配網' : ''}
                        {mode === 'auto' ? '系統自動選擇最佳配網模式' : ''}
                      </p>
                    </div>

                    {/* 手動配網：設備 ID */}
                    {mode === 'manual' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          設備 ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={deviceId}
                          onChange={(e) => setDeviceId(e.target.value)}
                          placeholder="輸入 Tuya 設備 ID（例如：bf1234567890abcdef）"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={status !== 'idle'}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          設備 ID 可以在 Tuya IoT Platform 或設備標籤上找到
                        </p>
                      </div>
                    )}

                    {/* Zigbee 配網：網關 ID */}
                    {mode === 'zigbee' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zigbee 網關 ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={zigbeeGatewayId}
                          onChange={(e) => setZigbeeGatewayId(e.target.value)}
                          placeholder="輸入 Zigbee 網關設備 ID"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={status !== 'idle'}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          確保 Zigbee 網關已連接到網絡並在線
                        </p>
                      </div>
                    )}

                    {/* Bluetooth 配網：MAC 地址 */}
                    {(mode === 'bt' || mode === 'wifi/bt') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bluetooth MAC 地址 {mode === 'wifi/bt' ? '' : <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={bluetoothMac}
                          onChange={(e) => setBluetoothMac(e.target.value)}
                          placeholder="輸入設備 Bluetooth MAC 地址（例如：AA:BB:CC:DD:EE:FF）"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={status !== 'idle'}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {mode === 'wifi/bt' ? '可選：提供 Bluetooth MAC 以啟用混合配網' : '確保設備藍牙已開啟並可被發現'}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {vendor === 'esp' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        配網模式
                      </label>
                      <select
                        value={mode === 'auto' ? 'smartconfig' : mode}
                        onChange={(e) => {
                          const newMode = e.target.value as 'ez' | 'ap' | 'auto' | 'smartconfig'
                          setMode(newMode)
                          // 重置 ESP 步驟
                          if (newMode === 'ap') {
                            setEspStep('connect')
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={status !== 'idle'}
                      >
                        <option value="smartconfig">SmartConfig（ESP-TOUCH）</option>
                        <option value="ap">AP 模式（熱點配網）</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        <strong>SmartConfig：</strong>設備指示燈快速閃爍時使用（需要本地工具或手機 App）
                        <br />
                        <strong>AP 模式：</strong>連接設備熱點（ESP_XXXXXX）後配置路由器 WiFi
                      </p>
                    </div>

                    {/* ESP AP 模式：步驟 1 - 連接設備熱點 */}
                    {mode === 'ap' && espStep === 'connect' && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">步驟 1: 連接設備熱點</h3>
                        <p className="text-xs text-gray-600 mb-3">
                          1. 確保 ESP 設備已進入配網模式（指示燈閃爍）
                          <br />
                          2. 在手機/電腦的 WiFi 設置中，連接到設備熱點（通常名為 ESP_XXXXXX）
                          <br />
                          3. 如果熱點有密碼，請輸入（大多數設備熱點無需密碼）
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            設備熱點密碼（可選）
                          </label>
                          <input
                            type="password"
                            value={espHotspotPassword}
                            onChange={(e) => setEspHotspotPassword(e.target.value)}
                            placeholder="大多數設備熱點無需密碼"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={status !== 'idle'}
                          />
                        </div>
                        <button
                          onClick={async () => {
                            // 嘗試掃描 WiFi 網絡
                            setIsScanningWifi(true)
                            try {
                              // 嘗試從 ESP 設備掃描（如果已連接）
                              const networks = await WiFiScanner.scanFromESPDevice()
                              
                              // 如果掃描失敗，使用已保存的網絡
                              const saved = WiFiScanner.getSavedNetworks()
                              const merged = WiFiScanner.mergeNetworks(networks, saved)
                              
                              if (merged.length > 0) {
                                setWifiNetworks(merged)
                                toast.success(`發現 ${merged.length} 個 WiFi 網絡`)
                              } else {
                                // 使用模擬網絡作為備選
                                const mock = WiFiScanner.getMockNetworks()
                                setWifiNetworks(mock)
                                toast('未掃描到網絡，顯示示例網絡', { icon: 'ℹ️' })
                              }
                              
                              // 進入配置步驟
                              setEspStep('configure')
                            } catch (error: any) {
                              console.error('WiFi scan error:', error)
                              // 即使掃描失敗，也進入配置步驟
                              const saved = WiFiScanner.getSavedNetworks()
                              const mock = WiFiScanner.getMockNetworks()
                              setWifiNetworks(WiFiScanner.mergeNetworks([], [...saved, ...mock]))
                              setEspStep('configure')
                              toast('無法掃描網絡，請手動輸入', { icon: '⚠️' })
                            } finally {
                              setIsScanningWifi(false)
                            }
                          }}
                          disabled={isScanningWifi || status !== 'idle'}
                          className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {isScanningWifi ? (
                            <>
                              <ClockIcon className="h-5 w-5 animate-spin" />
                              <span>掃描 WiFi 網絡中...</span>
                            </>
                          ) : (
                            <>
                              <MagnifyingGlassIcon className="h-5 w-5" />
                              <span>已連接設備熱點，下一步</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* ESP AP 模式：步驟 2 - 配置路由器 WiFi */}
                    {mode === 'ap' && espStep === 'configure' && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">步驟 2: 選擇路由器 WiFi</h3>
                        
                        {/* WiFi 網絡列表 */}
                        {wifiNetworks.length > 0 ? (
                          <div className="mb-3 max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                            {wifiNetworks.map((network, index) => {
                              const savedPassword = WiFiScanner.getSavedPassword(network.ssid)
                              const isSelected = selectedNetwork?.ssid === network.ssid
                              
                              return (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setSelectedNetwork(network)
                                    setSsid(network.ssid)
                                    // 如果有保存的密碼，自動填充
                                    if (savedPassword) {
                                      setPassword(savedPassword)
                                    }
                                  }}
                                  className={`w-full text-left p-3 border-b border-gray-200 hover:bg-gray-50 ${
                                    isSelected ? 'bg-blue-50 border-blue-300' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <WifiIcon className="h-4 w-4 text-gray-500" />
                                        <span className="font-medium text-sm">{network.ssid}</span>
                                        {network.isConnected && (
                                          <span className="text-xs text-green-600">已連接</span>
                                        )}
                                      </div>
                                      <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                                        {network.signalStrength && (
                                          <span>信號: {network.signalStrength} dBm</span>
                                        )}
                                        {network.security && network.security !== 'none' && (
                                          <span className="text-orange-600">
                                            {network.security.toUpperCase()}
                                          </span>
                                        )}
                                        {savedPassword && (
                                          <span className="text-green-600">已保存密碼</span>
                                        )}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 mb-3">未發現 WiFi 網絡，請手動輸入</p>
                        )}

                        {/* 手動輸入 WiFi */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              WiFi 網絡名稱 (SSID) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={ssid}
                              onChange={(e) => {
                                setSsid(e.target.value)
                                // 檢查是否有保存的密碼
                                const saved = WiFiScanner.getSavedPassword(e.target.value)
                                if (saved) {
                                  setPassword(saved)
                                  toast('已自動填充保存的密碼', { icon: '✓' })
                                }
                              }}
                              placeholder="輸入或選擇 WiFi 網絡名稱"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={status !== 'idle'}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              WiFi 密碼 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="輸入 WiFi 密碼"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={status !== 'idle'}
                            />
                            <div className="mt-1 flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="remember-password"
                                checked={true}
                                onChange={(e) => {
                                  if (e.target.checked && ssid && password) {
                                    WiFiScanner.saveNetwork(
                                      { ssid, security: 'wpa2' },
                                      password
                                    )
                                    toast('已保存 WiFi 密碼', { icon: '✓' })
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor="remember-password" className="text-xs text-gray-600">
                                記住此 WiFi 密碼
                              </label>
                            </div>
                          </div>

                          <button
                            onClick={() => setEspStep('connect')}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                          >
                            返回上一步
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* RESTful 設備配置（Philips, Panasonic） */}
            {isRESTfulDevice && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Base URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={vendor === 'philips' ? "e.g., http://192.168.1.100 (Hue Bridge IP)" : "e.g., https://api.panasonic.com"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={status !== 'idle'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={vendor === 'philips' ? "Hue Bridge API Key (留空以自動配對)" : "Panasonic API Key"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={status !== 'idle'}
                  />
                </div>

                {vendor === 'panasonic' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Token ({t('optional')})
                    </label>
                    <input
                      type="text"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Panasonic Access Token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={status !== 'idle'}
                    />
                  </div>
                )}

                {/* 設備發現按鈕 */}
                <div>
                  <button
                    onClick={handleDiscoverDevices}
                    disabled={isDiscovering || !baseUrl || !apiKey}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>{isDiscovering ? '發現中...' : '發現設備'}</span>
                  </button>
                </div>

                {/* 發現的設備列表 */}
                {discoveredDevices.length > 0 && (
                  <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                    <p className="text-sm font-medium text-gray-700 mb-2">發現的設備：</p>
                    {discoveredDevices.map((device, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectDevice(device)}
                        className="w-full text-left p-2 mb-1 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
                      >
                        <p className="font-medium text-sm">{device.deviceName}</p>
                        <p className="text-xs text-gray-500">ID: {device.deviceId}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 操作按鈕 */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleStartProvisioning}
                disabled={
                  (isMQTTDevice && (!ssid || !password)) ||
                  (isRESTfulDevice && (!baseUrl || !apiKey)) ||
                  status !== 'idle'
                }
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <WifiIcon className="h-5 w-5" />
                <span>開始配網</span>
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          // 配網進行中或完成
          <div className="space-y-4">
            <div className="text-center py-4">
              {status === 'provisioning' && isMQTTDevice && (
                <div>
                  {vendor === 'esp' ? (
                    <div>
                      <p className="text-gray-700 mb-2 font-medium">
                        請按照以下步驟進行 ESP 設備配網：
                      </p>
                      {mode === 'smartconfig' || mode === 'auto' ? (
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-700 mb-1">SmartConfig 模式：</p>
                          <ul className="text-sm text-gray-600 space-y-1 mb-3">
                            <li>• 設備進入 SmartConfig 模式（指示燈快速閃爍）</li>
                            <li>• 使用 ESP-TOUCH 工具或手機 App 發送配置</li>
                            <li>• 或使用本地工具通過 UDP 發送配置</li>
                            <li>• 設備距離路由器 1-2 米內</li>
                            <li>• 使用 2.4 GHz Wi-Fi 網絡</li>
                          </ul>
                        </div>
                      ) : (
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-700 mb-1">AP 模式：</p>
                          <ul className="text-sm text-gray-600 space-y-1 mb-3">
                            <li>• 設備進入 AP 模式（創建熱點 ESP_XXXXXX）</li>
                            <li>• 連接到設備熱點（Wi-Fi 設置中查找）</li>
                            <li>• 訪問 192.168.4.1 進行配置</li>
                            <li>• 輸入 Wi-Fi SSID 和密碼</li>
                            <li>• 等待設備連接到 Wi-Fi</li>
                          </ul>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        配網完成後，設備會連接到 Wi-Fi 並通過 MQTT 報告狀態。
                        <br />
                        您可以在 MQTT Broker 上查看設備是否已連接，然後手動添加設備。
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 mb-2">
                        請確保您的設備已進入配網模式：
                      </p>
                      <ul className="text-left text-sm text-gray-600 space-y-1 mb-4">
                        <li>• 設備指示燈閃爍</li>
                        <li>• 設備距離路由器 1-2 米內</li>
                        <li>• 使用 2.4 GHz Wi-Fi 網絡</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {status === 'pairing' && vendor === 'philips' && (
                <div>
                  <p className="text-gray-700 mb-2 font-medium">
                    請按下 Philips Hue Bridge 上的按鈕
                  </p>
                  <p className="text-sm text-gray-600">
                    然後點擊「開始配網」按鈕
                  </p>
                </div>
              )}
              {status === 'success' && (
                <div>
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">配網成功！</p>
                  {deviceId && (
                    <p className="text-sm text-gray-600 mt-2">
                      設備 ID: {deviceId}
                    </p>
                  )}
                  {deviceName && (
                    <p className="text-sm text-gray-600">
                      設備名稱: {deviceName}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              {status === 'provisioning' && (
                <button
                  onClick={handleStopProvisioning}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  停止配網
                </button>
              )}
              {(['success', 'failed', 'timeout'] as ProvisioningStatus[]).includes(status) && (
                <button
                  onClick={handleReset}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  重新配網
                </button>
              )}
              {status !== 'provisioning' && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  關閉
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

