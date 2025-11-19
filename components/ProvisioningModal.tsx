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
  const [mode, setMode] = useState<'ez' | 'ap' | 'auto'>('auto')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [status, setStatus] = useState<ProvisioningStatus>('idle')
  const [token, setToken] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)

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
    // 驗證必填欄位
    if (vendor === 'tuya' || vendor === 'midea' || vendor === 'esp') {
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
        }),
      })

      const data = await response.json()

      if (data.success) {
        setToken(data.token)
        setDeviceId(data.deviceId)
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
        setDeviceId(data.deviceId)
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
    setDeviceId(null)
    setDeviceName(null)
    setDeviceInfo(null)
    setError(null)
    setDiscoveredDevices([])
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
    setDeviceId(device.deviceId)
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
                    配網成功！設備 ID: {deviceId}
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

            {/* MQTT 設備配置（Tuya, Midea） */}
            {isMQTTDevice && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wi-Fi SSID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="輸入 Wi-Fi 網絡名稱"
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
                </div>

                {vendor === 'tuya' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      配網模式
                    </label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as 'ez' | 'ap' | 'auto')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={status !== 'idle'}
                    >
                      <option value="auto">自動選擇（推薦）</option>
                      <option value="ez">EZ 模式（快速配網）</option>
                      <option value="ap">AP 模式（熱點配網）</option>
                    </select>
                  </div>
                )}
                {vendor === 'esp' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      配網模式
                    </label>
                    <select
                      value={mode === 'auto' ? 'smartconfig' : mode}
                      onChange={(e) => setMode(e.target.value as 'ez' | 'ap' | 'auto')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={status !== 'idle'}
                    >
                      <option value="smartconfig">SmartConfig（ESP-TOUCH）</option>
                      <option value="ap">AP 模式（熱點配網）</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      <strong>SmartConfig：</strong>設備指示燈快速閃爍時使用（需要本地工具或手機 App）
                      <br />
                      <strong>AP 模式：</strong>連接設備熱點（ESP_XXXXXX）後訪問 192.168.4.1 進行配置
                    </p>
                  </div>
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

