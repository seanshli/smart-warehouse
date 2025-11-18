'use client'
// MQTT 設備控制面板組件
// 用於在 Smart Warehouse 中檢視和控制 MQTT IoT 設備（Tuya、ESP、Midea）

import useSWR from 'swr'
import { useCallback, useEffect, useState } from 'react'
import {
  PlusIcon,
  ArrowPathIcon,
  TrashIcon,
  PowerIcon,
  WifiIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'
import { useHousehold } from './HouseholdProvider'

// MQTT 設備介面
interface MQTTDevice {
  id: string // 設備 ID
  deviceId: string // MQTT 設備 ID
  name: string // 設備名稱
  vendor: 'tuya' | 'esp' | 'midea' // 供應商
  topic: string // MQTT 主題
  commandTopic?: string // 命令主題
  statusTopic?: string // 狀態主題
  status: 'online' | 'offline' // 連接狀態
  state?: any // 設備狀態（JSON）
  room?: {
    id: string
    name: string
  }
  lastSeen?: string // 最後在線時間
}

// SWR 資料獲取函數
const fetcher = (url: string) =>
  fetch(url, {
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) {
      throw new Error('Failed to fetch')
    }
    return res.json()
  })

export default function MQTTPanel() {
  const { t } = useLanguage() // 語言設定
  const { household } = useHousehold() // 當前家庭
  const [isAddingDevice, setIsAddingDevice] = useState(false) // 是否正在添加設備
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    name: '',
    vendor: 'tuya' as 'tuya' | 'esp' | 'midea',
    roomId: '',
  })

  // 獲取設備列表
  const { data: devices, error, isLoading, mutate } = useSWR<MQTTDevice[]>(
    household?.id ? `/api/mqtt/devices?householdId=${household.id}` : null,
    fetcher,
    {
      refreshInterval: 5000, // 每 5 秒刷新一次
      revalidateOnFocus: true,
    }
  )

  // 添加設備
  const handleAddDevice = async () => {
    if (!newDevice.deviceId || !newDevice.name || !household?.id) {
      toast.error(t('mqttDeviceName') + ' and ' + t('mqttDeviceId') + ' are required')
      return
    }

    try {
      const response = await fetch('/api/mqtt/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...newDevice,
          householdId: household.id,
          roomId: newDevice.roomId || null,
        }),
      })

      if (response.ok) {
        toast.success(t('mqttDeviceAdded'))
        setIsAddingDevice(false)
        setNewDevice({
          deviceId: '',
          name: '',
          vendor: 'tuya',
          roomId: '',
        })
        mutate() // 刷新列表
      } else {
        const error = await response.json()
        toast.error(error.error || t('mqttCommandFailed'))
      }
    } catch (error) {
      console.error('Error adding device:', error)
      toast.error(t('mqttCommandFailed'))
    }
  }

  // 刪除設備
  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm(t('mqttDeleteDevice') + '?')) {
      return
    }

    try {
      const response = await fetch(`/api/mqtt/devices/${deviceId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success(t('mqttDeviceDeleted'))
        mutate() // 刷新列表
      } else {
        toast.error(t('mqttCommandFailed'))
      }
    } catch (error) {
      console.error('Error deleting device:', error)
      toast.error(t('mqttCommandFailed'))
    }
  }

  // 發送控制命令
  const handleControl = async (deviceId: string, action: string, value?: any) => {
    try {
      const response = await fetch(`/api/mqtt/devices/${deviceId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action, value }),
      })

      if (response.ok) {
        toast.success(t('mqttCommandSent'))
        mutate() // 刷新設備狀態
      } else {
        const error = await response.json()
        toast.error(error.error || t('mqttCommandFailed'))
      }
    } catch (error) {
      console.error('Error sending command:', error)
      toast.error(t('mqttCommandFailed'))
    }
  }

  // 獲取供應商顯示名稱
  const getVendorName = (vendor: string) => {
    switch (vendor) {
      case 'tuya':
        return t('mqttVendorTuya')
      case 'esp':
        return t('mqttVendorESP')
      case 'midea':
        return t('mqttVendorMidea')
      default:
        return vendor
    }
  }

  // 獲取狀態顏色
  const getStatusColor = (status: string) => {
    return status === 'online' ? 'text-green-500' : 'text-gray-400'
  }

  if (!household?.id) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please select a household first
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* 標題和操作按鈕 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t('mqttDevices')}</h2>
          <p className="text-sm text-gray-500">
            {t('mqttVendorTuya')}, {t('mqttVendorESP')}, {t('mqttVendorMidea')} IoT {t('mqttDevices')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => mutate()}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            {t('homeAssistantRefresh')}
          </button>
          <button
            onClick={() => setIsAddingDevice(!isAddingDevice)}
            className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            {t('mqttAddDevice')}
          </button>
        </div>
      </div>

      {/* 添加設備表單 */}
      {isAddingDevice && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold">{t('mqttAddDevice')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('mqttDeviceId')}</label>
              <input
                type="text"
                value={newDevice.deviceId}
                onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                placeholder="e.g., tuya_device_001"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('mqttDeviceName')}</label>
              <input
                type="text"
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                placeholder="e.g., Living Room AC"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('mqttVendor')}</label>
              <select
                value={newDevice.vendor}
                onChange={(e) => setNewDevice({ ...newDevice, vendor: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="tuya">{t('mqttVendorTuya')}</option>
                <option value="esp">{t('mqttVendorESP')}</option>
                <option value="midea">{t('mqttVendorMidea')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('selectARoom')} ({t('optional')})</label>
              <input
                type="text"
                value={newDevice.roomId}
                onChange={(e) => setNewDevice({ ...newDevice, roomId: e.target.value })}
                placeholder={t('selectARoom')}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddDevice}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              {t('mqttAddDevice')}
            </button>
            <button
              onClick={() => setIsAddingDevice(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* 設備列表 */}
      {isLoading && (
        <div className="text-center py-8 text-gray-500">{t('loading')}</div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500">
          {t('mqttCommandFailed')}. {t('homeAssistantStatusError')}
        </div>
      )}

      {!isLoading && !error && devices && devices.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {t('mqttNoDevices')}
        </div>
      )}

      {!isLoading && !error && devices && devices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-white border rounded-lg p-4 space-y-3"
            >
              {/* 設備標題 */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{device.name}</h3>
                  <p className="text-sm text-gray-500">
                    {getVendorName(device.vendor)} • {device.deviceId}
                  </p>
                  {device.room && (
                    <p className="text-xs text-gray-400 mt-1">
                      Room: {device.room.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteDevice(device.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>

              {/* 狀態指示器 */}
              <div className="flex items-center gap-2">
                <WifiIcon className={`h-4 w-4 ${getStatusColor(device.status)}`} />
                <span className={`text-sm ${getStatusColor(device.status)}`}>
                  {device.status === 'online' ? t('mqttOnline') : t('mqttOffline')}
                </span>
                {device.lastSeen && (
                  <span className="text-xs text-gray-400">
                    {t('homeAssistantLastChanged')}: {new Date(device.lastSeen).toLocaleString()}
                  </span>
                )}
              </div>

              {/* 設備狀態 */}
              {device.state && (
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(device.state, null, 2)}
                  </pre>
                </div>
              )}

              {/* 控制按鈕 */}
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => handleControl(device.id, 'power_on')}
                  className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm flex items-center justify-center gap-1"
                >
                  <PowerIcon className="h-4 w-4" />
                  {t('mqttPowerOn')}
                </button>
                <button
                  onClick={() => handleControl(device.id, 'power_off')}
                  className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm flex items-center justify-center gap-1"
                >
                  <PowerIcon className="h-4 w-4" />
                  {t('mqttPowerOff')}
                </button>
              </div>

              {/* 供應商特定控制 */}
              {device.vendor === 'tuya' || device.vendor === 'midea' ? (
                <div className="grid grid-cols-2 gap-2">
                  {device.state?.temperature !== undefined && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('homeAssistantCurrentTemperature')}</label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleControl(device.id, 'set_temperature', (device.state?.temperature || 20) - 1)}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                        >
                          -
                        </button>
                        <span className="px-2 py-1 text-xs">{device.state?.temperature || 'N/A'}°C</span>
                        <button
                          onClick={() => handleControl(device.id, 'set_temperature', (device.state?.temperature || 20) + 1)}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

