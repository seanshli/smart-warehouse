'use client'

import useSWR from 'swr'
import { useCallback, useMemo, useState } from 'react'
import {
  ArrowPathIcon,
  LightBulbIcon,
  PowerIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useLanguage } from './LanguageProvider'

type HomeAssistantState = {
  entity_id: string
  state: string
  attributes: Record<string, any>
  last_changed: string
  last_updated: string
}

type FavoriteEntityConfig = {
  entity_id: string
  name?: string
  description?: string
}

const rawFavorites = process.env.NEXT_PUBLIC_HOME_ASSISTANT_ENTITIES

const favoriteEntities: FavoriteEntityConfig[] = (rawFavorites ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [entity_id, name] = entry.split('|').map((part) => part.trim())
    return { entity_id, name }
  })

const fetcher = (url: string) =>
  fetch(url, {
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return res.json()
  })

function formatTimestamp(timestamp: string, locale: string) {
  try {
    return new Date(timestamp).toLocaleString(locale)
  } catch {
    return timestamp
  }
}

export default function HomeAssistantPanel() {
  const { t, currentLanguage } = useLanguage()
  const [customEntityId, setCustomEntityId] = useState('')
  const [customPayload, setCustomPayload] = useState('{"entity_id": ""}')

  const queryParam =
    favoriteEntities.length > 0
      ? `?entity_ids=${encodeURIComponent(
          favoriteEntities.map((entity) => entity.entity_id).join(',')
        )}`
      : ''

  const { data, error, isLoading, mutate } = useSWR<{
    states: HomeAssistantState[]
  }>(`/api/homeassistant/states${queryParam}`, fetcher, {
    refreshInterval: 30_000,
  })

  const statesByEntity = useMemo(() => {
    const map = new Map<string, HomeAssistantState>()
    if (data?.states) {
      for (const state of data.states) {
        map.set(state.entity_id, state)
      }
    }
    return map
  }, [data])

  const derivedEntities = useMemo<FavoriteEntityConfig[]>(() => {
    if (!data?.states || data.states.length === 0) {
      return []
    }

    const preferredDomains = ['light', 'switch', 'climate', 'cover', 'scene']
    return data.states
      .filter((state) => preferredDomains.includes(state.entity_id.split('.')[0]))
      .slice(0, 6)
      .map((state) => ({
        entity_id: state.entity_id,
        name: state.attributes?.friendly_name || state.entity_id,
        description: state.attributes?.state_class || undefined,
      }))
  }, [data])

  const displayEntities = favoriteEntities.length > 0 ? favoriteEntities : derivedEntities

  const handleToggle = useCallback(
    async (entityId: string, turnOn: boolean) => {
      const domain = entityId.split('.')[0]
      const service = turnOn ? 'turn_on' : 'turn_off'

      try {
        await fetch(`/api/homeassistant/services/${domain}/${service}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ entity_id: entityId }),
        })
        toast.success(
          turnOn
            ? t('homeAssistantToggleOn') || 'Turned on.'
            : t('homeAssistantToggleOff') || 'Turned off.'
        )
        mutate()
      } catch (err) {
        console.error('Home Assistant toggle failed', err)
        toast.error(t('homeAssistantToggleError') || 'Action failed.')
      }
    },
    [mutate, t]
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
      await fetch(`/api/homeassistant/services/${domain}/${service}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      toast.success(t('homeAssistantCustomSuccess') || 'Service call sent.')
      mutate()
    } catch (err) {
      console.error('Home Assistant custom service failed', err)
      toast.error(t('homeAssistantCustomError') || 'Failed to call service.')
    }
  }, [customEntityId, customPayload, mutate, t])

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
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading
                ? t('homeAssistantStatusLoading') || '載入狀態中...'
                : error
                  ? t('homeAssistantStatusError') || '無法連線 Home Assistant'
                  : t('homeAssistantStatusReady') || '連線正常'}
            </div>
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              {t('homeAssistantRefresh') || '重新整理'}
            </button>
          </div>

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
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(entity.entity_id, true)}
                          className="inline-flex items-center rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                        >
                          <PowerIcon className="h-4 w-4 mr-1" />
                          {t('homeAssistantTurnOn') || '開啟'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(entity.entity_id, false)}
                          className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {t('homeAssistantTurnOff') || '關閉'}
                        </button>
                      </div>
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
    </div>
  )
}

