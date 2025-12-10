'use client'
// Home Assistant 配置模態框
// 用於配置 Home Assistant 服務器 URL 和 Access Token

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '../LanguageProvider'
import { useHousehold } from '../HouseholdProvider'

interface HomeAssistantConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function HomeAssistantConfigModal({
  isOpen,
  onClose,
  onSuccess,
}: HomeAssistantConfigModalProps) {
  const { t } = useLanguage()
  const { household } = useHousehold()
  const [baseUrl, setBaseUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    location?: string
    version?: string
    error?: string
  } | null>(null)

  // 載入現有配置
  useEffect(() => {
    if (isOpen && household?.id) {
      const loadConfig = async () => {
        try {
          const response = await fetch(`/api/household/${household.id}/homeassistant`)
          if (response.ok) {
            const data = await response.json()
            if (data.config) {
              setBaseUrl(data.config.baseUrl || '')
              setAccessToken('') // 不預填 token 以確保安全
            }
          }
        } catch (error) {
          console.error('Error loading HA config:', error)
        }
      }
      loadConfig()
    }
  }, [isOpen, household?.id])

  // 測試連接
  const handleTestConnection = async () => {
    const trimmedBaseUrl = baseUrl?.trim()
    const trimmedAccessToken = accessToken?.trim()

    if (!trimmedBaseUrl || !trimmedAccessToken) {
      toast.error('請輸入 Base URL 和 Access Token')
      return
    }

    setIsTesting(true)
    setConnectionStatus(null)

    try {
      const response = await fetch(
        `/api/mqtt/homeassistant/status?baseUrl=${encodeURIComponent(trimmedBaseUrl)}&accessToken=${encodeURIComponent(trimmedAccessToken)}`
      )
      const data = await response.json()

      if (data.connected) {
        setConnectionStatus({
          connected: true,
          location: data.location,
          version: data.version,
        })
        toast.success('連接成功！')
      } else {
        setConnectionStatus({
          connected: false,
          error: data.error || '連接失敗',
        })
        toast.error(data.error || '連接失敗')
      }
    } catch (error: any) {
      setConnectionStatus({
        connected: false,
        error: error.message || '測試連接時發生錯誤',
      })
      toast.error('測試連接時發生錯誤')
    } finally {
      setIsTesting(false)
    }
  }

  // 保存配置
  const handleSave = async () => {
    if (!household?.id) {
      toast.error('無法獲取家庭信息')
      return
    }

    const trimmedBaseUrl = baseUrl?.trim()
    const trimmedAccessToken = accessToken?.trim()

    if (!trimmedBaseUrl || !trimmedAccessToken) {
      toast.error('請輸入 Base URL 和 Access Token')
      return
    }

    // 如果還沒有測試連接，先測試
    if (!connectionStatus?.connected) {
      toast.error('請先測試連接以確保配置正確')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/household/${household.id}/homeassistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseUrl: trimmedBaseUrl,
          accessToken: trimmedAccessToken,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '保存配置失敗')
      }

      toast.success('Home Assistant 配置已保存！')
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error: any) {
      console.error('Error saving HA config:', error)
      toast.error(error.message || '保存配置失敗')
    } finally {
      setIsSaving(false)
    }
  }

  // 重置表單
  const handleReset = () => {
    setBaseUrl('')
    setAccessToken('')
    setConnectionStatus(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Home Assistant 服務器配置
          </h2>
          <button
            onClick={() => {
              handleReset()
              onClose()
            }}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Base URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="e.g., https://demoha.smtengo.com/"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              輸入 Home Assistant 服務器 URL
            </p>
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Access Token <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter your Long-Lived Access Token"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              輸入 Home Assistant 長期訪問令牌 (Long-Lived Access Token)
            </p>
          </div>

          {/* Connection Test */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-2">
              {connectionStatus && (
                <>
                  {connectionStatus.connected ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                </>
              )}
              <div className="text-sm">
                {connectionStatus?.connected ? (
                  <span className="text-green-700 dark:text-green-400">
                    已連接{connectionStatus.location ? ` - ${connectionStatus.location}` : ''}
                  </span>
                ) : connectionStatus ? (
                  <span className="text-red-700 dark:text-red-400">
                    連接失敗: {connectionStatus.error}
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">未測試連接</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !baseUrl?.trim() || !accessToken?.trim()}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isTesting ? '測試中...' : '測試連接'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              handleReset()
              onClose()
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !connectionStatus?.connected || !baseUrl?.trim() || !accessToken?.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  )
}

