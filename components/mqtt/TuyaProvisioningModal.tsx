'use client'
// Tuya 配網模態框組件
// 用於配置和啟動 Tuya 設備的配網流程
// Tuya Provisioning Modal Component - For configuring and starting Tuya device provisioning

import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  WifiIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '../LanguageProvider'

// 配網狀態
type ProvisioningStatus = 'idle' | 'starting' | 'provisioning' | 'success' | 'failed' | 'timeout'

interface TuyaProvisioningModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (deviceId: string, deviceName: string) => void
}

export default function TuyaProvisioningModal({
  isOpen,
  onClose,
  onSuccess,
}: TuyaProvisioningModalProps) {
  const { t } = useLanguage()
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'ez' | 'ap' | 'auto'>('auto')
  const [status, setStatus] = useState<ProvisioningStatus>('idle')
  const [token, setToken] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // 獲取當前 Wi-Fi SSID（如果可能）
  useEffect(() => {
    // 在 Web 環境中無法直接獲取 Wi-Fi SSID，需要用戶手動輸入
    // 在移動端可以通過 Capacitor 插件獲取
  }, [])

  // 清理輪詢
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // 啟動配網流程
  const handleStartProvisioning = async () => {
    if (!ssid || !password) {
      toast.error('Wi-Fi SSID 和密碼為必填項')
      return
    }

    setStatus('starting')
    setError(null)

    try {
      const response = await fetch('/api/mqtt/tuya/provisioning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ssid,
          password,
          mode,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setToken(data.token)
        setStatus('provisioning')
        
        // 開始輪詢配網狀態
        const interval = setInterval(async () => {
          await checkProvisioningStatus(data.token)
        }, 2000) // 每 2 秒查詢一次
        
        setPollingInterval(interval)

        // 設定超時（60 秒）
        setTimeout(() => {
          if (status === 'provisioning') {
            handleStopProvisioning()
            setStatus('timeout')
            setError('配網超時，請檢查設備是否已進入配網模式')
          }
        }, 60000)
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
      const response = await fetch(`/api/mqtt/tuya/provisioning?token=${provisioningToken}`, {
        method: 'GET',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success && data.deviceId) {
        // 配網成功
        setStatus('success')
        setDeviceId(data.deviceId)
        setDeviceName(data.deviceName || `Tuya Device ${data.deviceId}`)
        
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }

        toast.success('配網成功！')
        
        // 調用成功回調
        if (onSuccess && data.deviceId) {
          onSuccess(data.deviceId, data.deviceName || `Tuya Device ${data.deviceId}`)
        }
      } else if (data.status === 'failed') {
        // 配網失敗
        setStatus('failed')
        setError(data.error || '配網失敗')
        
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }
      }
      // 如果仍在配網中，繼續輪詢
    } catch (error: any) {
      console.error('Failed to check provisioning status:', error)
    }
  }

  // 停止配網流程
  const handleStopProvisioning = async () => {
    if (token) {
      try {
        await fetch(`/api/mqtt/tuya/provisioning?token=${token}`, {
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
    setStatus('idle')
    setToken(null)
    setDeviceId(null)
    setDeviceName(null)
    setError(null)
    handleStopProvisioning()
  }

  // 關閉模態框
  const handleClose = () => {
    handleStopProvisioning()
    handleReset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* 標題 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Tuya 設備配網</h2>
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
              {status === 'provisioning' && (
                <>
                  <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />
                  <span className="text-sm text-gray-700">配網中，請確保設備已進入配網模式...</span>
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
            {/* Wi-Fi SSID */}
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

            {/* Wi-Fi 密碼 */}
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

            {/* 配網模式 */}
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
              <p className="mt-1 text-xs text-gray-500">
                EZ 模式：設備指示燈快速閃爍時使用
                <br />
                AP 模式：設備指示燈慢速閃爍時使用
              </p>
            </div>

            {/* 操作按鈕 */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleStartProvisioning}
                disabled={!ssid || !password || status !== 'idle'}
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
              {status === 'provisioning' && (
                <div>
                  <p className="text-gray-700 mb-2">
                    請確保您的 Tuya 設備已進入配網模式：
                  </p>
                  <ul className="text-left text-sm text-gray-600 space-y-1 mb-4">
                    <li>• EZ 模式：設備指示燈快速閃爍</li>
                    <li>• AP 模式：設備指示燈慢速閃爍</li>
                    <li>• 設備距離路由器 1-2 米內</li>
                    <li>• 使用 2.4 GHz Wi-Fi 網絡</li>
                  </ul>
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

