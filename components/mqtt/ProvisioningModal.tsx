'use client'
// 統一配網模態框組件
// 支持所有品牌的 IoT 設備配網
// Unified Provisioning Modal Component - Supports provisioning for all IoT device brands

import { useState, useEffect, useMemo } from 'react'
import {
  XMarkIcon,
  WifiIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '../LanguageProvider'
import { useHousehold } from '../HouseholdProvider'
import { WiFiScanner, type WiFiNetwork } from '@/lib/wifi-scanner'
import {
  canUseNativeTuyaProvisioning,
  getNativeTuyaProvisioningStatus,
  startNativeTuyaProvisioning,
  stopNativeTuyaProvisioning,
} from '@/lib/provisioning/native-client'
import type { TuyaStartProvisioningOptions } from '@/lib/plugins/tuya'

// 配網狀態
type ProvisioningStatus = 'idle' | 'starting' | 'discovering' | 'provisioning' | 'pairing' | 'success' | 'failed' | 'timeout'

// 支持的品牌
type SupportedVendor = 'tuya' | 'midea' | 'philips' | 'panasonic' | 'esp' | 'homeassistant' | 'shelly' | 'aqara'

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
  const { household } = useHousehold() // 獲取當前 Household
  const [vendor, setVendor] = useState<SupportedVendor>(initialVendor || 'tuya')
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'wifi' | 'ez' | 'hotspot' | 'ap' | 'wifi/bt' | 'zigbee' | 'bt' | 'manual' | 'auto' | 'smartconfig'>('auto')
  const [deviceId, setDeviceId] = useState<string>('') // 手動配網時使用
  const [zigbeeGatewayId, setZigbeeGatewayId] = useState<string>('') // Zigbee 配網時使用
  const [bluetoothMac, setBluetoothMac] = useState<string>('') // Bluetooth 配網時使用
  const [deviceSsid, setDeviceSsid] = useState<string>('') // Midea AP 模式：設備熱點 SSID
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
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set())
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    location?: string
    version?: string
    error?: string
  } | null>(null)
  const [entitiesByDevice, setEntitiesByDevice] = useState<Array<{
    deviceId: string
    deviceName: string
    entities: Array<{
      entityId: string
      name: string
      state: string
      domain: string
    }>
  }>>([])
  
  // ESP 配網多步驟狀態
  const [espStep, setEspStep] = useState<'connect' | 'configure'>('connect') // ESP AP 模式步驟
  const [espHotspotPassword, setEspHotspotPassword] = useState<string>('') // ESP 設備熱點密碼（可選）
  const [wifiNetworks, setWifiNetworks] = useState<WiFiNetwork[]>([]) // 掃描到的 WiFi 網絡
  const [isScanningWifi, setIsScanningWifi] = useState(false) // 是否正在掃描 WiFi
  const [isLoadingSavedWifi, setIsLoadingSavedWifi] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<WiFiNetwork | null>(null) // 選中的 WiFi 網絡

  const useNativeTuyaProvisioning = useMemo(
    () => vendor === 'tuya' && canUseNativeTuyaProvisioning(),
    [vendor],
  )

  // 清理輪詢
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // 當模態框打開時，自動獲取當前連接的 WiFi SSID 或 HA 配置
  useEffect(() => {
    // 如果是 Home Assistant，自動載入 household 的 HA 配置
    if (isOpen && vendor === 'homeassistant' && household?.id) {
      const loadHAConfig = async () => {
        try {
          const response = await fetch(`/api/household/${household.id}/homeassistant`)
          if (response.ok) {
            const data = await response.json()
            if (data.config) {
              setBaseUrl(data.config.baseUrl || '')
              setAccessToken('') // Don't pre-fill token for security
              toast('已載入 Home Assistant 配置', { icon: 'ℹ️' })
            }
          }
        } catch (error) {
          console.error('Error loading HA config:', error)
        }
      }
      loadHAConfig()
    }

    // 檢查是否為 MQTT 設備（Tuya, Midea, ESP）
    const isMQTTDevice = vendor === 'tuya' || vendor === 'midea' || vendor === 'esp'
    
    if (isOpen && isMQTTDevice && vendor !== 'esp') {
      const getCurrentWiFi = async () => {
        try {
          const { Capacitor } = await import('@capacitor/core')
          if (Capacitor.getPlatform() !== 'web') {
            // 嘗試獲取當前連接的 WiFi SSID
            const WiFiPlugin = (await import('@/lib/plugins/wifi')).default
            const currentSSID = await WiFiPlugin.getCurrentSSID()
            
            if (currentSSID.ssid && !ssid) {
              // 自動填充當前 SSID
              setSsid(currentSSID.ssid)
              
              // 嘗試獲取已保存的密碼
              const savedPassword = await WiFiScanner.getSavedPassword(currentSSID.ssid)
              if (savedPassword) {
                setPassword(savedPassword)
                toast('已自動填充當前 WiFi 和保存的密碼', { icon: '✓' })
              } else {
                toast('已自動填充當前 WiFi，請輸入密碼', { icon: 'ℹ️' })
              }
            }
          }
        } catch (error) {
          // 靜默失敗，不影響用戶體驗
          console.log('Could not get current WiFi SSID:', error)
        }
      }
      
      getCurrentWiFi()
    }
  }, [isOpen, vendor, ssid, household?.id])

  // 當 vendor 切換到 Home Assistant 時，自動載入配置
  useEffect(() => {
    if (vendor === 'homeassistant' && household?.id && !baseUrl) {
      const loadHAConfig = async () => {
        try {
          const response = await fetch(`/api/household/${household.id}/homeassistant`)
          if (response.ok) {
            const data = await response.json()
            if (data.config) {
              setBaseUrl(data.config.baseUrl || '')
              // Don't auto-fill accessToken for security
            }
          }
        } catch (error) {
          console.error('Error loading HA config:', error)
        }
      }
      loadHAConfig()
    }
  }, [vendor, household?.id, baseUrl])

  // 測試 Home Assistant 連接
  const handleTestConnection = async () => {
    const trimmedBaseUrl = baseUrl?.trim()
    const trimmedAccessToken = accessToken?.trim()
    
    if (!trimmedBaseUrl || !trimmedAccessToken) {
      toast.error('請先輸入 Base URL 和 Access Token')
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus(null)
    setError(null)

    try {
      const response = await fetch(`/api/mqtt/homeassistant/status?baseUrl=${encodeURIComponent(trimmedBaseUrl)}&accessToken=${encodeURIComponent(trimmedAccessToken)}`)
      const data = await response.json()

      if (data.connected) {
        setConnectionStatus({
          connected: true,
          location: data.location,
          version: data.version,
        })
        toast.success(`連接成功${data.location ? ` - ${data.location}` : ''}`)
        // 連接成功後自動發現實體
        await handleDiscoverDevices()
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
        error: error.message || '連接失敗',
      })
      toast.error(error.message || '連接失敗')
    } finally {
      setIsTestingConnection(false)
    }
  }

  // 切換實體選擇
  const handleToggleEntity = (entityId: string) => {
    setSelectedEntities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entityId)) {
        newSet.delete(entityId)
      } else {
        newSet.add(entityId)
      }
      return newSet
    })
  }

  // 批量添加選中的實體
  const handleBatchAddEntities = async () => {
    if (selectedEntities.size === 0) {
      toast.error('請至少選擇一個實體')
      return
    }

    setStatus('starting')
    setError(null)

    let successCount = 0
    let failCount = 0

    for (const entityId of Array.from(selectedEntities)) {
      try {
        const response = await fetch('/api/mqtt/provisioning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            vendor: 'homeassistant',
            baseUrl,
            accessToken,
            deviceId: entityId,
            householdId: household?.id,
          }),
        })

        const data = await response.json()

        if (data.success && data.deviceId) {
          await autoAddDevice(
            data.deviceId,
            data.deviceName || `Device ${data.deviceId}`,
            data.deviceInfo
          )
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        failCount++
      }
    }

    if (successCount > 0) {
      toast.success(`成功添加 ${successCount} 個實體${failCount > 0 ? `，${failCount} 個失敗` : ''}`)
      setSelectedEntities(new Set())
      setStatus('idle')
    } else {
      toast.error(`添加失敗：${failCount} 個實體無法添加`)
      setStatus('idle')
    }
  }

  // 發現設備（Philips、Panasonic 和 Home Assistant）
  const handleDiscoverDevices = async () => {
    if (vendor !== 'philips' && vendor !== 'panasonic' && vendor !== 'homeassistant') {
      return
    }

    setIsDiscovering(true)
    setError(null)

    try {
      // Home Assistant: 如果已連接，獲取按設備分組的實體
      if (vendor === 'homeassistant' && connectionStatus?.connected && baseUrl && accessToken) {
        try {
          // 獲取所有實體狀態（按設備分組）
          const statesResponse = await fetch(`/api/mqtt/homeassistant/states?householdId=${household?.id || ''}`, {
            headers: {
              'X-HA-Base-Url': baseUrl,
              'X-HA-Access-Token': accessToken,
            },
          })
          
          if (statesResponse.ok) {
            const statesData = await statesResponse.json()
            
            // 如果 API 返回 devices 數組，使用它
            if (statesData.devices && Array.isArray(statesData.devices)) {
              setEntitiesByDevice(statesData.devices.map((device: any) => ({
                deviceId: device.id,
                deviceName: device.name,
                entities: device.entities.map((entity: any) => ({
                  entityId: entity.entity_id,
                  name: entity.attributes?.friendly_name || entity.entity_id.split('.')[1] || entity.entity_id,
                  state: entity.state,
                  domain: entity.entity_id.split('.')[0],
                })),
              })))
              
              // 同時設置 discoveredDevices 用於向後兼容
              const allEntities = statesData.devices.flatMap((device: any) => 
                device.entities.map((entity: any) => ({
                  deviceId: entity.entity_id,
                  deviceName: entity.attributes?.friendly_name || entity.entity_id,
                  deviceInfo: {
                    entityId: entity.entity_id,
                    state: entity.state,
                    attributes: entity.attributes,
                    domain: entity.entity_id.split('.')[0],
                  },
                }))
              )
              setDiscoveredDevices(allEntities)
              
              toast.success(`發現 ${statesData.devices.length} 個設備，共 ${allEntities.length} 個實體`)
              return
            }
          }
        } catch (error) {
          console.error('Error fetching grouped entities:', error)
        }
      }

      // 回退到標準發現流程
      const params = new URLSearchParams({
        vendor,
        action: 'discover',
      })

      if (baseUrl) params.append('baseUrl', baseUrl)
      if (apiKey) params.append('apiKey', apiKey)
      if (accessToken) params.append('accessToken', accessToken)

      const response = await fetch(`/api/mqtt/provisioning?${params.toString()}`, {
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
  // 更新 Tuya Home 對應關係（配網成功後）
  const updateTuyaHomeMapping = async (householdId: string, tuyaHomeId: string) => {
    try {
      const response = await fetch('/api/mqtt/tuya/home', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          householdId,
          tuyaHomeId,
        }),
      })

      if (response.ok) {
        console.log('✅ Tuya Home mapping updated:', { householdId, tuyaHomeId })
      } else {
        console.warn('⚠️ Failed to update Tuya Home mapping')
      }
    } catch (error) {
      console.error('Error updating Tuya Home mapping:', error)
    }
  }

  // 自動添加設備到數據庫
  const autoAddDevice = async (deviceId: string, deviceName: string, deviceInfo?: any) => {
    if (!household?.id) {
      console.warn('⚠️ No household found, skipping auto-add device')
      return false
    }

    try {
      // 構建設備添加請求
      const deviceData: any = {
        deviceId,
        name: deviceName || `Device ${deviceId}`,
        vendor,
        householdId: household.id,
      }

      // 根據供應商添加特定配置
      if (vendor === 'philips' || vendor === 'panasonic' || vendor === 'homeassistant') {
        // RESTful API 設備需要 baseUrl 和 apiKey/accessToken
        if (baseUrl) deviceData.baseUrl = baseUrl
        if (apiKey) deviceData.apiKey = apiKey
        if (accessToken) deviceData.accessToken = accessToken
        deviceData.connectionType = 'restful'
      } else {
        // MQTT 設備
        deviceData.connectionType = 'mqtt'
        
        // 從 deviceInfo 中提取 MQTT 主題信息
        if (deviceInfo) {
          if (deviceInfo.topic) deviceData.topic = deviceInfo.topic
          if (deviceInfo.commandTopic) deviceData.commandTopic = deviceInfo.commandTopic
          if (deviceInfo.statusTopic) deviceData.statusTopic = deviceInfo.statusTopic
        }
      }

      // 如果有房間選擇，添加房間 ID（目前不強制要求房間）
      // 注意：roomId 可以通過 UI 選擇，但自動添加時不強制要求

      // 添加設備元數據
      if (deviceInfo) {
        deviceData.metadata = deviceInfo
      }

      console.log('🔄 Auto-adding device:', deviceData)

      const response = await fetch('/api/mqtt/iot/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(deviceData),
      })

      if (response.ok) {
        const addedDevice = await response.json()
        console.log('✅ Device auto-added successfully:', addedDevice)
        toast.success(`設備 "${deviceName || deviceId}" 已自動添加到應用`)
        return true
      } else {
        const error = await response.json()
        // 如果設備已存在，不顯示錯誤（這是正常情況）
        if (response.status === 409) {
          console.log('ℹ️ Device already exists, skipping auto-add')
          toast('設備已存在於應用中', { icon: 'ℹ️' })
          return true
        } else {
          console.error('❌ Failed to auto-add device:', error)
          toast.error(`自動添加設備失敗: ${error.error || '未知錯誤'}`)
          return false
        }
      }
    } catch (error: any) {
      console.error('❌ Error auto-adding device:', error)
      toast.error(`自動添加設備時發生錯誤: ${error.message || '未知錯誤'}`)
      return false
    }
  }

  const handleProvisioningResponse = async (data: any) => {
    if (data.success) {
      setToken(data.token)
      setProvisionedDeviceId(data.deviceId)
      setDeviceName(data.deviceName)
      setDeviceInfo(data.deviceInfo)
      
      // 如果配網成功且提供了 householdId 和 tuyaHomeId，更新對應關係
      if (data.householdId && data.tuyaHomeId && household?.id === data.householdId) {
        updateTuyaHomeMapping(data.householdId, data.tuyaHomeId)
      }
      
      if (vendor === 'philips' || vendor === 'panasonic' || vendor === 'homeassistant') {
        setStatus('success')
        toast.success('配網成功！')
        
        // 自動添加設備到數據庫
        if (data.deviceId) {
          await autoAddDevice(
            data.deviceId,
            data.deviceName || `Device ${data.deviceId}`,
            data.deviceInfo
          )
        }
        
        if (onSuccess && data.deviceId) {
          onSuccess(data.deviceId, data.deviceName || `Device ${data.deviceId}`, vendor, data.deviceInfo)
        }
      } else if (vendor === 'esp') {
        setStatus('provisioning')
        toast('請按照設備說明進行配網操作', { icon: 'ℹ️' })
        
        // ESP 設備配網完成後，等待設備連接到 MQTT Broker，然後自動添加
        // 注意：ESP 設備可能需要一些時間才能連接到 MQTT Broker
        if (data.deviceId) {
          // 延遲 5 秒後嘗試自動添加（給設備時間連接到 MQTT Broker）
          setTimeout(async () => {
            await autoAddDevice(
              data.deviceId,
              data.deviceName || `ESP Device ${data.deviceId}`,
              data.deviceInfo
            )
          }, 5000)
        }
      } else {
        setStatus('provisioning')
        
        const interval = setInterval(async () => {
          await checkProvisioningStatus(data.token)
        }, 2000)
        
        setPollingInterval(interval)
        
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
  }

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
      else {
        if (!ssid || !password) {
          toast.error('Wi-Fi SSID 和密碼為必填項')
          return
        }
      }
    } else if (vendor === 'midea') {
      if (!ssid || !password) {
        toast.error('Wi-Fi SSID 和密碼為必填項')
        return
      }
      // Midea AP 模式需要設備熱點 SSID
      if (mode === 'ap' || mode === 'hotspot') {
        if (!deviceSsid) {
          toast.error('Midea AP 模式需要設備熱點 SSID（設備創建的 WiFi 熱點名稱）')
          return
        }
      }
    } else if (vendor === 'esp') {
      if (!ssid || !password) {
        toast.error('Wi-Fi SSID 和密碼為必填項')
        return
      }
    } else if (vendor === 'philips' || vendor === 'panasonic') {
      if (!baseUrl || !apiKey) {
        toast.error('Base URL 和 API Key 為必填項')
        return
      }
    } else if (vendor === 'homeassistant') {
      // Home Assistant 需要實體 ID 或已選擇的實體
      if (!deviceId && selectedEntities.size === 0) {
        toast.error('請輸入實體 ID 或選擇要添加的實體')
        return
      }
      // Home Assistant 需要 baseUrl 和 accessToken（可以從環境變數或 household 配置獲取）
      if (!baseUrl?.trim() || !accessToken?.trim()) {
        toast.error('請先測試連接以確保 Base URL 和 Access Token 正確')
        return
      }
    }

    setStatus('starting')
    setError(null)

    const provisioningPayload = {
      vendor,
      ssid,
      password,
      mode: vendor === 'esp' && mode === 'auto' ? 'smartconfig' : mode,
      baseUrl,
      apiKey,
      accessToken,
      // Include deviceId for Tuya manual mode or Home Assistant
      deviceId: (vendor === 'tuya' && mode === 'manual') || vendor === 'homeassistant' ? deviceId : undefined,
      zigbeeGatewayId: vendor === 'tuya' && mode === 'zigbee' ? zigbeeGatewayId : undefined,
      bluetoothMac: vendor === 'tuya' && (mode === 'bt' || mode === 'wifi/bt') ? bluetoothMac : undefined,
      deviceSsid: vendor === 'midea' && (mode === 'ap' || mode === 'hotspot') ? deviceSsid : undefined,
      // 傳遞 Household 信息（用於 Tuya Home 對應）
      householdId: household?.id,
      householdName: household?.name,
    }

    try {
      let data: any

      if (useNativeTuyaProvisioning) {
        data = await startNativeTuyaProvisioning(
          provisioningPayload as TuyaStartProvisioningOptions,
        )
      } else {
        const response = await fetch('/api/mqtt/provisioning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(provisioningPayload),
        })

        data = await response.json()
      }

      handleProvisioningResponse(data)
    } catch (error: any) {
      setStatus('failed')
      setError(error.message || '配網啟動失敗')
      toast.error(error.message || '配網啟動失敗')
    }
  }

  // 查詢配網狀態
  const checkProvisioningStatus = async (provisioningToken: string) => {
    try {
      let data: any
      
      if (useNativeTuyaProvisioning) {
        data = await getNativeTuyaProvisioningStatus({
          vendor: 'tuya',
          token: provisioningToken,
        })
      } else {
        const response = await fetch(`/api/mqtt/provisioning?vendor=${vendor}&token=${provisioningToken}`, {
          method: 'GET',
          credentials: 'include',
        })

        data = await response.json()
      }

      if (data.success && data.deviceId) {
        setStatus('success')
        setProvisionedDeviceId(data.deviceId)
        setDeviceName(data.deviceName || `Device ${data.deviceId}`)
        setDeviceInfo(data.deviceInfo)
        
        // 如果配網成功且提供了 householdId 和 tuyaHomeId，更新對應關係
        if (data.householdId && data.tuyaHomeId && household?.id === data.householdId) {
          updateTuyaHomeMapping(data.householdId, data.tuyaHomeId)
        }
        
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }

        toast.success('配網成功！')
        
        // 自動添加設備到數據庫（對於 MQTT 設備：Tuya, Midea）
        if (data.deviceId && (vendor === 'tuya' || vendor === 'midea')) {
          // 延遲 3 秒後自動添加（給設備時間連接到 MQTT Broker）
          setTimeout(async () => {
            await autoAddDevice(
              data.deviceId,
              data.deviceName || `Device ${data.deviceId}`,
              data.deviceInfo
            )
          }, 3000)
        }
        
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
        if (useNativeTuyaProvisioning) {
          await stopNativeTuyaProvisioning({
            vendor: 'tuya',
            token,
          })
        } else {
          await fetch(`/api/mqtt/provisioning?vendor=${vendor}&token=${token}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        }
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
    setDeviceSsid('')
    // Reset Home Assistant specific states
    setConnectionStatus(null)
    setEntitiesByDevice([])
    setSelectedEntities(new Set())
    setIsTestingConnection(false)
    setIsDiscovering(false)
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

  const handleScanWifi = async () => {
    setIsScanningWifi(true)
    setError(null)
    try {
      // 使用 WiFiScanner.scan() 自动选择最佳扫描方式
      const networks = await WiFiScanner.scan()
      
      if (networks.length > 0) {
        setWifiNetworks(networks)
        toast.success(`發現 ${networks.length} 個 WiFi 網絡`)
      } else {
        toast('未掃描到網絡，請手動輸入或載入已保存的 WiFi', { icon: 'ℹ️' })
      }
    } catch (error: any) {
      console.error('WiFi scan error:', error)
      toast.error(error.message || 'WiFi 掃描失敗')
    } finally {
      setIsScanningWifi(false)
    }
  }

  const handleScanServerWifi = async () => {
    setIsScanningWifi(true)
    try {
      // 使用智能扫描：优先原生，失败则回退到服务器
      const scanned = await WiFiScanner.scan()
      const saved = await WiFiScanner.getSavedNetworks()
      const merged = WiFiScanner.mergeNetworks(scanned, saved)
      setWifiNetworks(merged)

      if (scanned.length > 0) {
        toast.success(`掃描到 ${scanned.length} 個 WiFi 網絡`)
      } else if (saved.length > 0) {
        toast('未掃描到新的 WiFi，已載入保存的網絡', { icon: 'ℹ️' })
      } else {
        toast('未掃描到 WiFi 網絡，請手動輸入', { icon: 'ℹ️' })
      }
    } catch (error: any) {
      console.error('WiFi scan failed:', error)
      const saved = await WiFiScanner.getSavedNetworks()
      setWifiNetworks(saved)
      if (saved.length > 0) {
        toast('掃描失敗，已載入保存的 WiFi', { icon: 'ℹ️' })
      } else {
        toast.error(error.message || '無法掃描 WiFi 網絡，請在本機環境執行或手動輸入')
      }
    } finally {
      setIsScanningWifi(false)
    }
  }

  const handleLoadSavedWifi = async () => {
    setIsLoadingSavedWifi(true)
    try {
      const saved = await WiFiScanner.getSavedNetworks()
      setWifiNetworks(saved)
      if (saved.length > 0) {
        toast.success(`載入 ${saved.length} 個已保存的 WiFi`)
      } else {
        toast('目前沒有已保存的 WiFi，請先手動輸入並勾選記住', { icon: 'ℹ️' })
      }
    } finally {
      setIsLoadingSavedWifi(false)
    }
  }

  const isMQTTDevice = vendor === 'tuya' || vendor === 'midea' || vendor === 'esp'
  const isRESTfulDevice = vendor === 'philips' || vendor === 'panasonic' || vendor === 'homeassistant'

  if (!isOpen) return null

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
            {vendor === 'homeassistant' && 'Home Assistant 設備添加'}
            {vendor === 'shelly' && 'Shelly 設備添加'}
            {vendor === 'aqara' && 'Aqara 設備添加'}
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
                  <option value="homeassistant">Home Assistant</option>
                </select>
              </div>
            )}
            {/* MQTT 設備配置（Tuya, Midea） */}
            {isMQTTDevice && vendor !== 'esp' && (
              <>
                <div className="space-y-2">
                  <button
                    onClick={handleScanWifi}
                    disabled={isScanningWifi || status !== 'idle'}
                    className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>{isScanningWifi ? '掃描中…' : '掃描 WiFi 網絡'}</span>
                  </button>
                  <button
                    onClick={handleLoadSavedWifi}
                    disabled={isLoadingSavedWifi || status !== 'idle'}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>{isLoadingSavedWifi ? '載入中…' : '載入已保存的 WiFi'}</span>
                  </button>
                  <p className="text-xs text-gray-500">
                    提示：若要掃描周圍的 Wi-Fi，請在「安裝於本機的 Smart Warehouse App」或具有網卡存取權限的環境執行。
                    若裝置或瀏覽器不支援掃描，可以載入已保存的 Wi-Fi 或手動輸入。
                  </p>
                </div>

                {/* 掃描 / 已載入的 WiFi 列表 */}
                {wifiNetworks.length > 0 && (
                  <div className="mb-3 max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                    {wifiNetworks.map((network, index) => {
                      const isSelected = selectedNetwork?.ssid === network.ssid
                      const hasSavedPassword = network.password !== undefined
                      
                      return (
                        <button
                          key={index}
                          onClick={async () => {
                            setSelectedNetwork(network)
                            setSsid(network.ssid)
                            // 异步获取保存的密码
                            const savedPassword = await WiFiScanner.getSavedPassword(network.ssid)
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
                                {hasSavedPassword && (
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
                    onChange={async (e) => {
                      setSsid(e.target.value)
                      // 檢查是否有保存的密碼（异步）
                      const saved = await WiFiScanner.getSavedPassword(e.target.value)
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
                      onChange={async (e) => {
                        if (e.target.checked && ssid && password) {
                          await WiFiScanner.saveNetwork(
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

                {/* Midea AP 模式：設備熱點 SSID */}
                {vendor === 'midea' && (mode === 'ap' || mode === 'hotspot') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      設備熱點 SSID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deviceSsid}
                      onChange={(e) => setDeviceSsid(e.target.value)}
                      placeholder="輸入設備創建的 WiFi 熱點名稱（例如：Midea_XXXXXX）"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={status !== 'idle'}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Midea AP 模式：設備會創建一個 WiFi 熱點，請先連接到該熱點，然後輸入熱點名稱
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ESP SmartConfig 模式也需要 WiFi 選擇 */}
            {vendor === 'esp' && mode === 'smartconfig' && (
              <>
                <div>
                  <button
                    onClick={handleScanWifi}
                    disabled={isScanningWifi || status !== 'idle'}
                    className="w-full mb-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>{isScanningWifi ? '掃描中...' : '掃描 WiFi 網絡'}</span>
                  </button>
                  <p className="text-xs text-gray-500">
                    SmartConfig 需要路由器的 Wi-Fi 資訊。請允許應用程式在本機掃描或於無法掃描時手動輸入。
                  </p>
                </div>

                {wifiNetworks.length > 0 && (
                  <div className="mb-3 max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                    {wifiNetworks.map((network, index) => {
                      const isSelected = selectedNetwork?.ssid === network.ssid
                      const hasSavedPassword = network.password !== undefined
                      
                      return (
                        <button
                          key={index}
                          onClick={async () => {
                            setSelectedNetwork(network)
                            setSsid(network.ssid)
                            const savedPassword = await WiFiScanner.getSavedPassword(network.ssid)
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
                                {hasSavedPassword && (
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
                    onChange={async (e) => {
                      setSsid(e.target.value)
                      const saved = await WiFiScanner.getSavedPassword(e.target.value)
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
                      onChange={async (e) => {
                        if (e.target.checked && ssid && password) {
                          await WiFiScanner.saveNetwork(
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

            {/* Midea 配網模式選擇 */}
            {vendor === 'midea' && (
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
                    if (newMode !== 'ap' && newMode !== 'hotspot') setDeviceSsid('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={status !== 'idle'}
                >
                  <option value="ap">AP 模式（熱點配網）</option>
                  <option value="hotspot">Hotspot 配網（AP模式）</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {mode === 'ap' || mode === 'hotspot' 
                    ? '設備指示燈慢速閃爍時使用，連接設備熱點進行配置。需要先連接到設備創建的 WiFi 熱點，然後輸入路由器 WiFi 信息。'
                    : 'Midea 目前支持 AP 模式配網'}
                </p>
              </div>
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
                              const saved = await WiFiScanner.getSavedNetworks()
                              const merged = WiFiScanner.mergeNetworks(networks, saved)
                              
                              if (merged.length > 0) {
                                setWifiNetworks(merged)
                                toast.success(`發現 ${merged.length} 個 WiFi 網絡`)
                              } else {
                                toast('未掃描到網絡，請手動輸入', { icon: 'ℹ️' })
                              }
                              
                              // 進入配置步驟
                              setEspStep('configure')
                            } catch (error: any) {
                              console.error('WiFi scan error:', error)
                              // 即使掃描失敗，也進入配置步驟
                              const saved = await WiFiScanner.getSavedNetworks()
                              setWifiNetworks(saved)
                              setEspStep('configure')
                              if (saved.length > 0) {
                                toast('無法掃描網絡，已載入保存的 WiFi', { icon: 'ℹ️' })
                              } else {
                                toast('無法掃描網絡，請手動輸入', { icon: '⚠️' })
                              }
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
                              const isSelected = selectedNetwork?.ssid === network.ssid
                              const hasSavedPassword = network.password !== undefined
                              
                              return (
                                <button
                                  key={index}
                                  onClick={async () => {
                                    setSelectedNetwork(network)
                                    setSsid(network.ssid)
                                    // 如果有保存的密碼，自動填充
                                    const savedPassword = await WiFiScanner.getSavedPassword(network.ssid)
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
                                        {hasSavedPassword && (
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
                              onChange={async (e) => {
                                setSsid(e.target.value)
                                // 檢查是否有保存的密碼
                                const saved = await WiFiScanner.getSavedPassword(e.target.value)
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
                                onChange={async (e) => {
                                  if (e.target.checked && ssid && password) {
                                    await WiFiScanner.saveNetwork(
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
                    placeholder={
                      vendor === 'philips' 
                        ? "e.g., http://192.168.1.100 (Hue Bridge IP)" 
                        : vendor === 'homeassistant'
                        ? "e.g., https://demoha.smtengo.com/"
                        : "e.g., https://api.panasonic.com"
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={status !== 'idle'}
                  />
                  {vendor === 'homeassistant' && (
                    <p className="mt-1 text-xs text-gray-500">
                      輸入 Home Assistant 服務器 URL
                    </p>
                  )}
                </div>

                {vendor !== 'homeassistant' && (
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
                )}

                {vendor === 'homeassistant' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Token <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Home Assistant Long-Lived Access Token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={status !== 'idle'}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      輸入 Home Assistant 長期訪問令牌 (Long-Lived Access Token)
                    </p>
                  </div>
                )}

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

                {vendor === 'homeassistant' && (
                  <>
                    {/* 連接測試按鈕和狀態 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        {connectionStatus && (
                          <div className={`h-2 w-2 rounded-full ${
                            connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        )}
                        <div className="text-sm">
                          {connectionStatus?.connected ? (
                            <span className="text-green-700">
                              已連接{connectionStatus.location ? ` - ${connectionStatus.location}` : ''}
                            </span>
                          ) : connectionStatus ? (
                            <span className="text-red-700">
                              連接失敗: {connectionStatus.error}
                            </span>
                          ) : (
                            <span className="text-gray-600">未測試連接</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTestingConnection || !baseUrl?.trim() || !accessToken?.trim()}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isTestingConnection ? '測試中...' : '測試連接'}
                      </button>
                    </div>

                    {/* 手動輸入實體 ID（可選） */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        實體 ID (Entity ID) <span className="text-gray-400 text-xs">(可選，用於手動添加單個實體)</span>
                      </label>
                      <input
                        type="text"
                        value={deviceId}
                        onChange={(e) => {
                          setDeviceId(e.target.value)
                          // 當輸入實體 ID 時，如果連接已成功，可以允許配網
                        }}
                        placeholder="e.g., light.living_room, switch.bedroom, climate.thermostat"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={status !== 'idle'}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        輸入 Home Assistant 實體 ID。格式：domain.entity_name（例如：light.living_room）
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Shelly 設備添加說明 */}
            {(vendor === 'shelly' || vendor === 'aqara') && (
              <>
                {vendor === 'shelly' && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Shelly 設備添加說明</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Shelly 設備使用 MQTT 協議，不需要傳統配網流程。設備已經連接到網絡並通過 MQTT Broker 通信。
                    </p>
                    <div className="space-y-2 text-sm text-blue-700">
                      <p><strong>方法 1: 自動發現（推薦）</strong></p>
                      <p>• 點擊「掃描設備」按鈕，系統會自動掃描 MQTT Broker 發現所有 Shelly 設備</p>
                      <p>• 確保 Shelly 設備已配置 MQTT 並連接到同一個 MQTT Broker</p>
                      <p className="mt-3"><strong>方法 2: 手動添加</strong></p>
                      <p>• 如果知道設備 ID，可以在下方輸入設備 ID 手動添加</p>
                      <p>• Shelly 設備 ID 格式：shelly-{'{device-type}'}-{'{device-id}'}</p>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        設備 ID (可選，用於手動添加)
                      </label>
                      <input
                        type="text"
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                        placeholder="例如：shelly-plus-1pm-ABC123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={status !== 'idle'}
                      />
                    </div>
                  </div>
                )}

                {/* Aqara 設備添加說明 */}
                {vendor === 'aqara' && (
                  <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                    <h3 className="text-sm font-semibold text-cyan-900 mb-2">Aqara 設備添加說明</h3>
                    <p className="text-sm text-cyan-800 mb-3">
                      Aqara 設備使用 Zigbee 協議，通過 zigbee2mqtt 網關連接到 MQTT。設備需要先與 zigbee2mqtt 網關配對。
                    </p>
                    <div className="space-y-2 text-sm text-cyan-700">
                      <p><strong>前提條件：</strong></p>
                      <p>• 已設置 zigbee2mqtt 網關並連接到 MQTT Broker</p>
                      <p>• Aqara 設備已與 zigbee2mqtt 網關配對</p>
                      <p className="mt-3"><strong>方法 1: 自動發現（推薦）</strong></p>
                      <p>• 點擊「掃描設備」按鈕，系統會自動掃描 MQTT Broker 發現所有 Aqara 設備</p>
                      <p>• 設備會出現在 zigbee2mqtt MQTT 主題中（zigbee2mqtt/+/+）</p>
                      <p className="mt-3"><strong>方法 2: 手動添加</strong></p>
                      <p>• 如果知道設備 ID，可以在下方輸入設備 ID 手動添加</p>
                      <p>• Aqara 設備 ID 格式：{'{friendly_name}'}（在 zigbee2mqtt 中配置的名稱）</p>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        設備 ID (可選，用於手動添加)
                      </label>
                      <input
                        type="text"
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                        placeholder="例如：Aqara Motion Sensor"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={status !== 'idle'}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 設備發現按鈕 */}
            <div>
              <button
                onClick={handleDiscoverDevices}
                disabled={isDiscovering || ((vendor === 'philips' || vendor === 'panasonic') && (!baseUrl || !apiKey))}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span>{isDiscovering ? '發現中...' : '發現設備'}</span>
              </button>
            </div>

            {/* 發現的設備列表 - 按設備分組（Home Assistant） */}
            {vendor === 'homeassistant' && entitiesByDevice.length > 0 && (
              <div className="border border-gray-300 rounded-md p-4 mt-4 space-y-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    發現的設備和實體 ({entitiesByDevice.length} 個設備)
                  </p>
                  {selectedEntities.size > 0 && (
                    <button
                      type="button"
                      onClick={handleBatchAddEntities}
                      disabled={status !== 'idle'}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      批量添加選中 ({selectedEntities.size})
                    </button>
                  )}
                </div>
                {entitiesByDevice.map((device) => (
                  <div key={device.deviceId} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">{device.deviceName}</h4>
                      <span className="text-xs text-gray-500">{device.entities.length} 個實體</span>
                    </div>
                    <div className="space-y-1">
                      {device.entities.map((entity) => (
                        <label
                          key={entity.entityId}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEntities.has(entity.entityId)}
                            onChange={() => handleToggleEntity(entity.entityId)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={status !== 'idle'}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{entity.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {entity.entityId} • {entity.state}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 發現的設備列表 - 標準格式（其他品牌） */}
            {vendor !== 'homeassistant' && discoveredDevices.length > 0 && (
              <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto mt-4">
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

            {/* 操作按鈕 */}
            <div className="flex space-x-3 pt-4">
              {(vendor === 'shelly' || vendor === 'aqara') ? (
                <button
                  onClick={handleDiscoverDevices}
                  disabled={isDiscovering}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  <span>{isDiscovering ? '掃描中...' : '掃描 MQTT 設備'}</span>
                </button>
              ) : (
                <button
                  onClick={handleStartProvisioning}
                  disabled={
                    (isMQTTDevice && (!ssid || !password)) ||
                    ((vendor === 'philips' || vendor === 'panasonic') && (!baseUrl || !apiKey)) ||
                    (vendor === 'homeassistant' && (!baseUrl?.trim() || !accessToken?.trim()) && (!deviceId && selectedEntities.size === 0)) ||
                    status !== 'idle'
                  }
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <WifiIcon className="h-5 w-5" />
                  <span>開始配網</span>
                </button>
              )}
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

