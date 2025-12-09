'use client'
// Home Assistant 控制面板組件
// 用於在 Smart Warehouse 中檢視和控制 Home Assistant 智慧家居裝置

import useSWR from 'swr'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowPathIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  WifiIcon,
  LinkSlashIcon,
  LinkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from '../LanguageProvider'
import { useHousehold } from '../HouseholdProvider'
import { FanSpeedOptions, SegmentedControl } from './HomeAssistantSegments'
import ProvisioningModal from './ProvisioningModal'

// Home Assistant 實體狀態類型定義
type HomeAssistantState = {
  entity_id: string // 實體 ID
  state: string // 狀態值
  attributes: Record<string, any> // 屬性字典
  last_changed: string // 最後變更時間
  last_updated: string // 最後更新時間
}

// 常用實體配置類型
type FavoriteEntityConfig = {
  entity_id: string // 實體 ID
  name?: string // 顯示名稱（可選）
  description?: string // 描述（可選）
}

// 從環境變數讀取常用實體列表
const rawFavorites = process.env.NEXT_PUBLIC_HOME_ASSISTANT_ENTITIES

// 解析常用實體配置（格式：entity_id|name,entity_id2|name2）
const favoriteEntities: FavoriteEntityConfig[] = (rawFavorites ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [entity_id, name] = entry.split('|').map((part) => part.trim())
    return { entity_id, name }
  })

// SWR 資料獲取函數
const fetcher = (url: string) =>
  fetch(url, {
    credentials: 'include', // 包含認證資訊
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return res.json()
  })

// 格式化時間戳記為本地時間字串
function formatTimestamp(timestamp: string, locale: string) {
  try {
    return new Date(timestamp).toLocaleString(locale)
  } catch {
    return timestamp
  }
}

export default function HomeAssistantPanel() {
  const { t, currentLanguage } = useLanguage()
  const { household } = useHousehold()
  const [customEntityId, setCustomEntityId] = useState('')
  const [customPayload, setCustomPayload] = useState('{"entity_id": ""}')
  const [liveStates, setLiveStates] = useState<Map<string, HomeAssistantState>>(
    new Map()
  )
  const [isStreamLive, setIsStreamLive] = useState(false)
  const [haConfig, setHaConfig] = useState<{
    baseUrl: string
    username: string | null
    serverIp: string | null
  } | null>(null)
  const [isProvisioningModalOpen, setIsProvisioningModalOpen] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [showAllEntities, setShowAllEntities] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)

  // Fetch HA config for current household
  const { data: haConfigData } = useSWR<{
    success: boolean
    config: {
      baseUrl: string
      username: string | null
      serverIp: string | null
    } | null
  }>(
    household?.id ? `/api/household/${household.id}/homeassistant` : null,
    fetcher
  )

  useEffect(() => {
    if (haConfigData?.config) {
      setHaConfig(haConfigData.config)
    } else {
      setHaConfig(null)
    }
  }, [haConfigData])

  const queryParam =
    favoriteEntities.length > 0
      ? `?entity_ids=${encodeURIComponent(
          favoriteEntities.map((entity) => entity.entity_id).join(',')
        )}${household?.id ? `&householdId=${household.id}` : ''}`
      : household?.id ? `?householdId=${household.id}` : ''

  const { data, error, isLoading, mutate } = useSWR<{
    states: HomeAssistantState[]
  }>(`/api/mqtt/homeassistant/states${queryParam}`, fetcher, {
    refreshInterval: 30_000,
  })

  useEffect(() => {
    if (data?.states) {
      setLiveStates((prev) => {
        const map = new Map(prev)
        data.states.forEach((state) => {
          map.set(state.entity_id, state)
        })
        return map
      })
    }
  }, [data])

  const entityIdsForStream = useMemo(() => {
    const ids = new Set<string>()
    if (favoriteEntities.length > 0) {
      favoriteEntities.forEach((entity) => ids.add(entity.entity_id))
    }
    MEDOLE_ENTITY_ORDER.forEach((id) => ids.add(id))
    return Array.from(ids)
  }, [])

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (entityIdsForStream.length === 0) return

    let stopped = false
    let source: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const params = new URLSearchParams({
      entities: entityIdsForStream.join(','),
    })

    const connect = () => {
      if (stopped) return
      source = new EventSource(`/api/mqtt/homeassistant/events?${params}`)

      source.onopen = () => {
        setIsStreamLive(true)
      }

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload?.entity_id && payload?.new_state) {
            setLiveStates((prev) => {
              const map = new Map(prev)
              map.set(payload.entity_id, payload.new_state)
              return map
            })
            // Debounced refresh to ensure all states are in sync
            // Only refresh if this is a Medole entity to avoid excessive API calls
            if (MEDOLE_ENTITY_ORDER.includes(payload.entity_id)) {
              if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
              }
              refreshTimeoutRef.current = setTimeout(() => {
                mutate()
              }, 500) // Wait 500ms after last state change
            }
          }
        } catch (error) {
          console.error('Failed to parse Home Assistant SSE payload:', error)
        }
      }

      source.onerror = (error) => {
        console.error('Home Assistant SSE error:', error)
        setIsStreamLive(false)
        source?.close()
        source = null
        if (!stopped) {
          if (reconnectTimeout) clearTimeout(reconnectTimeout)
          reconnectTimeout = setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      stopped = true
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current)
      if (source) {
        source.close()
      }
    }
  }, [entityIdsForStream, mutate])

  useEffect(() => {
    const interval = setInterval(() => {
      mutate()
    }, isStreamLive ? 60000 : 15000)

    return () => clearInterval(interval)
  }, [isStreamLive, mutate])

  // Merge initial SWR data with live updates from EventSource
  // This ensures we always have the latest state, whether from polling or real-time updates
  const statesByEntity = useMemo(() => {
    const merged = new Map<string, HomeAssistantState>()
    // First, add all states from initial SWR fetch
    if (data?.states) {
      data.states.forEach((state) => {
        merged.set(state.entity_id, state)
      })
    }
    // Then, overlay any live updates from EventSource (these are more recent)
    liveStates.forEach((state, entityId) => {
      merged.set(entityId, state)
    })
    return merged
  }, [data?.states, liveStates])

  const derivedEntities = useMemo<FavoriteEntityConfig[]>(() => {
    if (!data?.states || data.states.length === 0) {
      return []
    }

    const preferredDomains = ['light', 'switch', 'climate', 'cover', 'scene', 'fan', 'select']
    const filtered = data.states.filter((state) => {
      const domain = state.entity_id.split('.')[0]
      return preferredDomains.includes(domain)
    })
    
    // If showing all entities, don't limit
    const entities = filtered.map((state) => ({
      entity_id: state.entity_id,
      name: state.attributes?.friendly_name || state.entity_id,
      description: state.attributes?.state_class || undefined,
    }))
    
    return showAllEntities ? entities : entities.slice(0, 20) // Show up to 20 entities
  }, [data, showAllEntities])

  const allEntitiesByDomain = useMemo(() => {
    if (!data?.states || data.states.length === 0) {
      return {}
    }
    
    const grouped: Record<string, FavoriteEntityConfig[]> = {}
    data.states.forEach((state) => {
      const domain = state.entity_id.split('.')[0]
      if (!grouped[domain]) {
        grouped[domain] = []
      }
      grouped[domain].push({
        entity_id: state.entity_id,
        name: state.attributes?.friendly_name || state.entity_id,
        description: state.attributes?.state_class || undefined,
      })
    })
    return grouped
  }, [data])

  const displayEntities = useMemo(() => {
    const base = favoriteEntities.length > 0 ? favoriteEntities : derivedEntities
    if (selectedDomain) {
      return base.filter((entity) => entity.entity_id.split('.')[0] === selectedDomain)
    }
    return base
  }, [favoriteEntities, derivedEntities, selectedDomain])

  const handleToggle = useCallback(
    async (entityId: string, turnOn: boolean) => {
      const domain = entityId.split('.')[0]
      const service = turnOn ? 'turn_on' : 'turn_off'

      try {
        const requestBody = household?.id 
          ? { entity_id: entityId, householdId: household.id }
          : { entity_id: entityId }

        const response = await fetch(`/api/mqtt/homeassistant/services/${domain}/${service}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        toast.success(
          turnOn
            ? t('homeAssistantToggleOn') || 'Turned on.'
            : t('homeAssistantToggleOff') || 'Turned off.'
        )
        mutate()
      } catch (err: any) {
        console.error('Home Assistant toggle failed', err)
        toast.error(err.message || t('homeAssistantToggleError') || 'Action failed.')
      }
    },
    [household?.id, mutate, t]
  )

  const handleCustomService = useCallback(async () => {
    if (!customEntityId.trim()) {
      toast.error(t('homeAssistantCustomEntityRequired') || 'Entity ID required.')
      return
    }

    try {
      const [domain, service] = customEntityId.trim().split('.')
      if (!domain || !service) {
        toast.error(
          t('homeAssistantCustomFormatError') ||
            'Use domain.service format, e.g. light.turn_on'
        )
        return
      }

      const payload = JSON.parse(customPayload || '{}')
      // Include householdId in payload for per-household HA config
      const requestBody = household?.id 
        ? { ...payload, householdId: household.id }
        : payload

      const response = await fetch(`/api/mqtt/homeassistant/services/${domain}/${service}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      toast.success(t('homeAssistantCustomSuccess') || 'Service call sent.')
      mutate()
    } catch (err: any) {
      console.error('Home Assistant custom service failed', err)
      toast.error(err.message || t('homeAssistantCustomError') || 'Failed to call service.')
    }
  }, [customEntityId, customPayload, household?.id, mutate, t])

  const handleDisconnectHA = useCallback(async () => {
    if (!household?.id) {
      toast.error('無法斷開連接：未選擇住戶')
      return
    }

    setIsLinking(true)
    try {
      const response = await fetch(`/api/household/${household.id}/homeassistant`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '斷開連接失敗')
      }

      setHaConfig(null)
      toast.success('已斷開 Home Assistant 連接')
      mutate() // Refresh the data
    } catch (err: any) {
      console.error('Failed to disconnect HA:', err)
      toast.error(err.message || '斷開連接失敗')
    } finally {
      setIsLinking(false)
    }
  }, [household?.id, mutate])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-5 sm:px-6 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('homeAssistantPanelTitle') || 'Home Assistant 控制面板'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('homeAssistantPanelDescription') ||
                '檢視和控制家庭自動化狀態。'}
            </p>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading
                  ? t('homeAssistantStatusLoading') || '載入狀態中...'
                  : error
                    ? t('homeAssistantStatusError') || '無法連線 Home Assistant'
                    : t('homeAssistantStatusReady') || '連線正常'}
              </div>
              {haConfig && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {haConfig.baseUrl} {haConfig.username && `(${haConfig.username})`}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!haConfig && (
                <button
                  type="button"
                  onClick={() => setIsProvisioningModalOpen(true)}
                  className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                  title="配網 Home Assistant 服務器"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  配網
                </button>
              )}
              {haConfig && (
                <button
                  type="button"
                  onClick={handleDisconnectHA}
                  disabled={isLinking}
                  className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                  title="斷開 Home Assistant 連接"
                >
                  <LinkSlashIcon className="h-4 w-4 mr-2" />
                  斷開
                </button>
              )}
              <button
                type="button"
                onClick={() => mutate()}
                className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                {t('homeAssistantRefresh') || '重新整理'}
              </button>
            </div>
          </div>

          {/* Only show MedoleDehumidifierCard if Medole entities exist */}
          {Object.values(MEDOLE_ENTITIES).some((entityId) => 
            statesByEntity.has(entityId)
          ) && (
            <MedoleDehumidifierCard
              states={statesByEntity}
              onServiceSuccess={mutate}
              t={t}
              currentLanguage={currentLanguage}
            />
          )}

          {/* Entity Browser */}
          {data?.states && data.states.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {t('homeAssistantEntities') || '實體列表'}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAllEntities(!showAllEntities)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {showAllEntities 
                      ? t('homeAssistantShowLess') || '顯示較少'
                      : t('homeAssistantShowAll') || `顯示全部 (${data.states.length})`}
                  </button>
                  {Object.keys(allEntitiesByDomain).length > 0 && (
                    <select
                      value={selectedDomain || ''}
                      onChange={(e) => setSelectedDomain(e.target.value || null)}
                      className="text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1"
                    >
                      <option value="">{t('homeAssistantAllDomains') || '所有類型'}</option>
                      {Object.keys(allEntitiesByDomain).sort().map((domain) => (
                        <option key={domain} value={domain}>
                          {domain} ({allEntitiesByDomain[domain].length})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {displayEntities.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {displayEntities.map((entity) => {
                const state = statesByEntity.get(entity.entity_id)
                const domain = entity.entity_id.split('.')[0]
                const isToggleable = ['light', 'switch', 'fan', 'climate', 'cover'].includes(domain)

                return (
                  <div
                    key={entity.entity_id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entity.name || entity.entity_id}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {entity.entity_id}
                        </div>
                      </div>
                      <LightBulbIcon className="h-5 w-5 text-primary-500" />
                    </div>

                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {state?.state ?? (t('homeAssistantUnknown') || '未知')}
                    </div>

                    {state?.attributes?.friendly_name && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {state.attributes.friendly_name}
                      </div>
                    )}

                    {isToggleable ? (
                      <ToggleButtons
                        entityId={entity.entity_id}
                        state={state}
                        t={t}
                        onToggle={handleToggle}
                      />
                    ) : (
                      <div className="text-xs text-gray-400">
                        {t('homeAssistantToggleUnsupported') ||
                          '此裝置不支援快速開關控制。'}
                      </div>
                    )}

                    {state?.last_changed && (
                      <div className="text-xs text-gray-400">
                        {t('homeAssistantLastChanged') || '最後更新'}:{' '}
                        {formatTimestamp(state.last_changed, currentLanguage)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/30 p-4 text-sm text-gray-500 dark:text-gray-400">
              {t('homeAssistantNoEntities') ||
                '尚未設定常用實體。您可以在環境變數 NEXT_PUBLIC_HOME_ASSISTANT_ENTITIES 中加入想要顯示的 entity_id，或直接使用下方自訂服務呼叫控制任意裝置。'}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('homeAssistantCustomTitle') || '自訂服務呼叫'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('homeAssistantCustomDescription') ||
                '輸入 domain.service 及 JSON 載荷，例如：light.turn_on，{"entity_id": "light.living_room"}'}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customEntityId}
                onChange={(event) => setCustomEntityId(event.target.value)}
                placeholder="domain.service"
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleCustomService}
                className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                {t('homeAssistantSendService') || '送出'}
              </button>
            </div>

            <textarea
              value={customPayload}
              onChange={(event) => setCustomPayload(event.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
            />
          </div>
        </div>
      </div>

      <ProvisioningModal
        isOpen={isProvisioningModalOpen}
        onClose={() => setIsProvisioningModalOpen(false)}
        vendor="homeassistant"
      />
    </div>
  )
}

const MEDOLE_ENTITIES = {
  power: 'select.medole_erv_d9a344_pai_feng_ji_feng_su',
  powerSelect: 'select.medole_erv_d9a344_pai_feng_ji_feng_su', // Alias for backward compatibility
  airRecycle: 'switch.medole_dehumidifier_d9a344_huan_qi_yun_zuo_xxx',
  humidity1: 'fan.medole_dehumidifier_d9a344_shi_du_kong_zhi_qi_1',
  humidity2: 'fan.medole_dehumidifier_d9a344_shi_du_kong_zhi_qi_2',
  fanSpeed: 'select.delta_erv_d9a344_feng_liang_mo_shi',
  filterDays: 'number.medole_dehumidifier_d9a344_lu_xin_geng_huan_shi_jian_tian',
  setHumidity: 'select.medole_dehumidifier_d9a344_set_humidity',
} as const

const MEDOLE_POWER_SWITCH_CANDIDATES = [
  process.env.NEXT_PUBLIC_MEDOLE_POWER_SWITCH,
  'switch.medole_dehumidifier_d9a344_power',
  'switch.medole_dehumidifier_d9a344_main_power',
  'switch.medole_dehumidifier_d9a344_zhu_kai_guan',
  'switch.medole_dehumidifier_d9a344',
].filter(Boolean) as string[]

const MEDOLE_ENTITY_ORDER = Array.from(
  new Set([
    ...Object.values(MEDOLE_ENTITIES),
    ...MEDOLE_POWER_SWITCH_CANDIDATES,
  ])
)

type ToggleButtonsProps = {
  entityId: string
  state?: HomeAssistantState
  t: (key: keyof import('@/lib/translations').Translations) => string
  onToggle: (entity: string, turnOn: boolean) => Promise<void>
}

function ToggleButtons({ entityId, state, t, onToggle }: ToggleButtonsProps) {
  const isOn = state?.state !== 'off'

  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={() => onToggle(entityId, true)}
        className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium ${
          isOn
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {t('homeAssistantTurnOn') || '開啟'}
      </button>
      <button
        type="button"
        onClick={() => onToggle(entityId, false)}
        className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium ${
          !isOn
            ? 'bg-primary-200 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
            : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {t('homeAssistantTurnOff') || '關閉'}
      </button>
    </div>
  )
}

type MedoleCardProps = {
  states: Map<string, HomeAssistantState>
  onServiceSuccess: () => void
  t: (key: keyof import('@/lib/translations').Translations) => string
  currentLanguage: string
}

type MedoleFanLevel = 'high' | 'medium' | 'low' | 'off'

const FAN_LEVELS: { key: MedoleFanLevel; label: string; percentage: number }[] =
  [
    { key: 'high', label: 'High', percentage: 100 },
    { key: 'medium', label: 'Medium', percentage: 66 },
    { key: 'low', label: 'Low', percentage: 33 },
    { key: 'off', label: 'Off', percentage: 0 },
  ]

function getFanLevel(state?: HomeAssistantState): MedoleFanLevel {
  if (!state || state.state === 'off') {
    return 'off'
  }
  const percentage = state.attributes?.percentage ?? 0
  if (percentage >= 90) return 'high'
  if (percentage >= 60) return 'medium'
  if (percentage >= 30) return 'low'
  return 'off'
}

function formatRelativeTime(timestamp?: string, locale?: string) {
  if (!timestamp) return ''
  try {
    const diffMs = Date.now() - new Date(timestamp).getTime()
    const diffMinutes = Math.round(diffMs / 60000)
    if (diffMinutes < 1) {
      return 'Just now'
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`
    }
    const diffHours = Math.round(diffMinutes / 60)
    return `${diffHours} hr ago`
  } catch {
    return timestamp
  }
}

function MedoleDehumidifierCard({
  states,
  onServiceSuccess,
  t,
  currentLanguage,
}: MedoleCardProps) {
  // Power entity is select.medole_erv_d9a344_pai_feng_ji_feng_su
  const powerState = states.get(MEDOLE_ENTITIES.power)
  const airRecycleState = states.get(MEDOLE_ENTITIES.airRecycle)
  const humidity1State = states.get(MEDOLE_ENTITIES.humidity1)
  const humidity2State = states.get(MEDOLE_ENTITIES.humidity2)
  const fanSpeedState = states.get(MEDOLE_ENTITIES.fanSpeed)
  const filterState = states.get(MEDOLE_ENTITIES.filterDays)
  const humidityTargetState = states.get(MEDOLE_ENTITIES.setHumidity)

  // Check for a separate switch entity (if exists)
  const powerSwitchEntry = MEDOLE_POWER_SWITCH_CANDIDATES.map((entityId) => ({
    entityId,
    state: states.get(entityId),
  })).find((entry) => entry.state)

  const selectOptions = powerState?.attributes?.options ?? ['Off', 'On', '連續']
  const fanOptions = fanSpeedState?.attributes?.options ?? []
  const humidityOptions = humidityTargetState?.attributes?.options ?? []

  const handleSelectOption = async (entityId: string, option: string) => {
    try {
      const response = await fetch(
        `/api/mqtt/homeassistant/services/select/select_option`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entity_id: entityId,
            option,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      toast.success(t('homeAssistantModeUpdated') || 'Mode updated.')
      onServiceSuccess()
    } catch (error: any) {
      console.error('Failed to set select option:', error)
      toast.error(error.message || t('homeAssistantToggleError') || 'Action failed.')
    }
  }

  const handleFanLevel = async (
    entityId: string,
    level: MedoleFanLevel
  ) => {
    try {
      let response: Response
      if (level === 'off') {
        response = await fetch(`/api/mqtt/homeassistant/services/fan/turn_off`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_id: entityId }),
        })
      } else {
        const target = FAN_LEVELS.find((option) => option.key === level)
        response = await fetch(`/api/mqtt/homeassistant/services/fan/set_percentage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_id: entityId,
            percentage: target?.percentage ?? 0,
          }),
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      toast.success(t('homeAssistantHumidityUpdated') || 'Updated.')
      onServiceSuccess()
    } catch (error: any) {
      console.error('Failed to set fan level:', error)
      toast.error(error.message || t('homeAssistantToggleError') || 'Action failed.')
    }
  }

  const handleSwitch = async (entityId: string, turnOn: boolean) => {
    const domain = 'switch'
    const service = turnOn ? 'turn_on' : 'turn_off'
    try {
      const response = await fetch(`/api/mqtt/homeassistant/services/${domain}/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: entityId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      toast.success(
        turnOn
          ? t('homeAssistantToggleOn') || 'Turned on.'
          : t('homeAssistantToggleOff') || 'Turned off.'
      )
      onServiceSuccess()
    } catch (error: any) {
      console.error('Failed to toggle switch:', error)
      toast.error(error.message || t('homeAssistantToggleError') || 'Action failed.')
    }
  }

  const powerOnOption = findMatchingOption(selectOptions, POWER_ON_KEYWORDS)
  const powerOffOption = findMatchingOption(selectOptions, POWER_OFF_KEYWORDS)
  const powerDisplayName =
    powerSwitchEntry?.state?.attributes?.friendly_name ||
    powerState?.attributes?.friendly_name ||
    'Medole Dehumidifier'
  
  // Determine if power is on based on current state
  const isPowerOn = powerSwitchEntry
    ? powerSwitchEntry.state?.state === 'on'
    : powerState?.state && !POWER_OFF_KEYWORDS.some((kw) => 
        powerState.state.toLowerCase().includes(kw)
      )

  const handlePowerToggle = async (turnOn: boolean) => {
    const targetLabel = turnOn
      ? t('homeAssistantTurnOn') || 'Turned on.'
      : t('homeAssistantTurnOff') || 'Turned off.'

    try {
      // First try switch entity if available
      if (powerSwitchEntry?.entityId) {
        await handleSwitch(powerSwitchEntry.entityId, turnOn)
        return
      }

      // Use select entity (power) directly - select.medole_erv_d9a344_pai_feng_ji_feng_su
      if (powerState && selectOptions.length > 0) {
        let targetOption: string | undefined
        
        if (turnOn) {
          // When turning on, find first option that's not 'off' or similar
          // Prefer "On" or "連續" (Continuous) over other options
          targetOption = selectOptions.find((opt: string) => 
            POWER_ON_KEYWORDS.some((kw) => opt.toLowerCase().includes(kw))
          ) || selectOptions.find((opt: string) => 
            !POWER_OFF_KEYWORDS.some((kw) => opt.toLowerCase().includes(kw))
          )
        } else {
          // When turning off, find first option that matches 'off' or similar
          targetOption = selectOptions.find((opt: string) =>
            POWER_OFF_KEYWORDS.some((kw) => opt.toLowerCase().includes(kw))
          )
        }
        
        if (targetOption) {
          await handleSelectOption(MEDOLE_ENTITIES.power, targetOption)
          toast.success(targetLabel)
          onServiceSuccess()
          return
        }
        
        // If no option found, show error
        toast.error(
          t('homeAssistantPowerOptionMissing') || 'Power options unavailable.'
        )
        return
      }

      toast.error(
        t('homeAssistantPowerUnavailable') || 'Power entity unavailable.'
      )
    } catch (error: any) {
      console.error('Failed to toggle power:', error)
      toast.error(error.message || t('homeAssistantToggleError') || 'Action failed.')
    }
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-sky-100 via-white to-sky-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 shadow-md p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {powerDisplayName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatRelativeTime(
              powerSwitchEntry?.state?.last_changed ||
                powerState?.last_changed,
              currentLanguage
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => handlePowerToggle(!isPowerOn)}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow transition ${
              isPowerOn
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            {isPowerOn
              ? t('homeAssistantTurnOff') || '關閉'
              : t('homeAssistantTurnOn') || '開啟'}
          </button>
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-300">
            {humidityTargetState?.state || '--'}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl bg-white/60 dark:bg-slate-900/50 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {t('homeAssistantClimateSection') || 'Humidity Control'}
          </h4>

          <SegmentedControl
            label={t('homeAssistantPower' as keyof import('@/lib/translations').Translations) || 'Power'}
            options={selectOptions}
            value={powerState?.state || ''}
            onSelect={(option) =>
              handleSelectOption(MEDOLE_ENTITIES.power, option)
            }
          />

          <SegmentedControl
            label={t('homeAssistantModes') || 'Mode'}
            options={humidityOptions}
            value={humidityTargetState?.state || ''}
            onSelect={(option) =>
              handleSelectOption(MEDOLE_ENTITIES.setHumidity, option)
            }
          />

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {t('homeAssistantHumidifierSection') || 'Air Recycle'}
            </p>
            <button
              type="button"
              onClick={() =>
                handleSwitch(
                  MEDOLE_ENTITIES.airRecycle,
                  airRecycleState?.state !== 'on'
                )
              }
              className={`w-full rounded-full py-2 text-sm font-medium transition ${
                airRecycleState?.state === 'on'
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-200'
              }`}
            >
              {airRecycleState?.state === 'on'
                ? t('homeAssistantTurnOff') || '關閉'
                : t('homeAssistantTurnOn') || '開啟'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white/60 dark:bg-slate-900/50 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {t('homeAssistantHumidifierSection') || 'Airflow Control'}
            </h4>
            <SegmentedControl
              label={t('homeAssistantModes') || 'Mode'}
              options={
                FAN_LEVELS.map((option) =>
                  t(`homeAssistantMode${capitalize(option.label)}` as any) ||
                  option.label
                ) as string[]
              }
              value={
                t(
                  `homeAssistantMode${capitalize(
                    getFanLevel(humidity1State)
                  )}` as any
                ) || capitalize(getFanLevel(humidity1State))
              }
              onSelect={(label) => {
                const option = FAN_LEVELS.find(
                  (item) =>
                    t(`homeAssistantMode${capitalize(item.label)}` as any) ===
                      label || item.label === label
                )
                if (option) {
                  handleFanLevel(MEDOLE_ENTITIES.humidity1, option.key)
                }
              }}
            />
            <SegmentedControl
              label={t('homeAssistantModes') || 'Mode'}
              options={
                FAN_LEVELS.map((option) =>
                  t(`homeAssistantMode${capitalize(option.label)}` as any) ||
                  option.label
                ) as string[]
              }
              value={
                t(
                  `homeAssistantMode${capitalize(
                    getFanLevel(humidity2State)
                  )}` as any
                ) || capitalize(getFanLevel(humidity2State))
              }
              onSelect={(label) => {
                const option = FAN_LEVELS.find(
                  (item) =>
                    t(`homeAssistantMode${capitalize(item.label)}` as any) ===
                      label || item.label === label
                )
                if (option) {
                  handleFanLevel(MEDOLE_ENTITIES.humidity2, option.key)
                }
              }}
            />
          </div>

          <div className="rounded-2xl bg-white/60 dark:bg-slate-900/50 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {t('homeAssistantModes') || 'Fan Speed'}
            </h4>
            <SegmentedControl
              label={t('homeAssistantModes') || 'Mode'}
              options={fanOptions}
              value={fanSpeedState?.state || ''}
              onSelect={(option) =>
                handleSelectOption(MEDOLE_ENTITIES.fanSpeed, option)
              }
            />
          </div>

          <div className="rounded-2xl bg-white/60 dark:bg-slate-900/50 p-4">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {t('homeAssistantCurrentHumidity') || 'Filter Remaining (days)'}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {filterState?.state || '--'}
            </div>
            <div className="text-xs text-gray-400">
              {formatRelativeTime(filterState?.last_changed, currentLanguage)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const POWER_ON_KEYWORDS = ['on', '開', '开启', '啟動', 'start', 'auto']
const POWER_OFF_KEYWORDS = ['off', '關', '关闭', '停止', 'standby']

function findMatchingOption(options: string[], keywords: string[]) {
  const loweredKeywords = keywords.map((keyword) => keyword.toLowerCase())
  return options.find((option) => {
    const lowerOption = option.toLowerCase()
    return loweredKeywords.some(
      (keyword) => lowerOption === keyword || lowerOption.includes(keyword)
    )
  })
}

