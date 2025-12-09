// Home Assistant 狀態 API 路由
// 代理 Home Assistant 實體狀態查詢請求

import { NextRequest, NextResponse } from 'next/server'
import { getHomeAssistantStates, HomeAssistantState } from '@/lib/homeassistant'

export const dynamic = 'force-dynamic' // 強制動態路由

// GET 處理器：獲取 Home Assistant 實體狀態
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entityParam = searchParams.get('entity_ids') // 從查詢參數獲取實體 ID 列表
    const householdId = searchParams.get('householdId') // 從查詢參數獲取 household ID
    const baseUrl = request.headers.get('X-HA-Base-Url') || searchParams.get('baseUrl')
    const accessToken = request.headers.get('X-HA-Access-Token') || searchParams.get('accessToken')
    
    // 解析實體 ID 列表（格式：entity_id1,entity_id2,...）
    const entityIds = entityParam
      ? entityParam
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : undefined // 如果未提供，則獲取所有實體

    // 如果提供了自定義 baseUrl 和 accessToken，臨時設置環境變數
    const originalBaseUrl = process.env.HOME_ASSISTANT_BASE_URL
    const originalToken = process.env.HOME_ASSISTANT_ACCESS_TOKEN

    if (baseUrl) {
      process.env.HOME_ASSISTANT_BASE_URL = baseUrl
    }
    if (accessToken) {
      process.env.HOME_ASSISTANT_ACCESS_TOKEN = accessToken
    }

    try {
      // 呼叫 Home Assistant API 獲取狀態（使用 household 特定配置或臨時配置）
      const states = await getHomeAssistantStates(entityIds, householdId || null)

    // 按設備分組實體
    const devicesMap = new Map<string, {
      id: string
      name: string
      entities: HomeAssistantState[]
      manufacturer?: string
      model?: string
    }>()

    // 過濾掉系統級別的實體（如 binary_sensor.backups_stale, sensor.date 等）
    const systemDomains = ['sensor', 'binary_sensor', 'sun', 'zone', 'person', 'device_tracker', 'automation', 'script', 'scene']
    const systemEntityPatterns = ['backups', 'date', 'time', 'sun', 'zone', 'person', 'automation', 'script', 'scene']
    
    const filteredStates = states.filter((state) => {
      const domain = state.entity_id.split('.')[0]
      const entityName = state.entity_id.split('.')[1] || ''
      
      // 跳過系統級別的實體
      if (systemDomains.includes(domain) && !state.attributes?.device_id && !state.attributes?.device?.id) {
        // 檢查是否是系統實體（沒有關聯設備）
        if (systemEntityPatterns.some(pattern => entityName.toLowerCase().includes(pattern))) {
          return false
        }
      }
      
      // 只包含有設備關聯的實體，或者明確標記為設備的實體
      return state.attributes?.device_id || 
             state.attributes?.device?.id || 
             !systemDomains.includes(domain) ||
             (domain === 'sensor' || domain === 'binary_sensor') && (state.attributes?.device_id || state.attributes?.device?.id)
    })

    filteredStates.forEach((state) => {
      // 嘗試從 attributes 獲取設備信息
      const deviceId = state.attributes?.device_id || state.attributes?.device?.id
      const deviceName = state.attributes?.device?.name || 
                        state.attributes?.device_name ||
                        // 從 friendly_name 推斷設備名稱（例如："米多力除溼機 電源" -> "米多力除溼機"）
                        (state.attributes?.friendly_name 
                          ? state.attributes.friendly_name.split(/\s+/)[0]
                          : null)

      // 如果沒有 device_id 和 deviceName，跳過（這是系統級別的實體）
      if (!deviceId && !deviceName) {
        return
      }

      // 使用 device_id 作為主要 key，如果沒有則使用 deviceName
      const key = deviceId || deviceName

      if (!devicesMap.has(key)) {
        devicesMap.set(key, {
          id: deviceId || key,
          name: deviceName || state.entity_id.split('.')[0],
          entities: [],
          manufacturer: state.attributes?.device?.manufacturer || state.attributes?.manufacturer,
          model: state.attributes?.device?.model || state.attributes?.model,
        })
      }

      devicesMap.get(key)!.entities.push(state)
    })

      const devices = Array.from(devicesMap.values())

      return NextResponse.json(
        {
          states, // 返回實體狀態陣列（向後兼容）
          devices, // 返回按設備分組的數據
        },
        { status: 200 }
      )
    } finally {
      // 恢復原始環境變數
      if (baseUrl) {
        process.env.HOME_ASSISTANT_BASE_URL = originalBaseUrl
      }
      if (accessToken) {
        process.env.HOME_ASSISTANT_ACCESS_TOKEN = originalToken
      }
    }
  } catch (error) {
    console.error('Failed to fetch Home Assistant states:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Home Assistant states' },
      { status: 500 }
    )
  }
}

