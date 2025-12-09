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
    
    // 解析實體 ID 列表（格式：entity_id1,entity_id2,...）
    const entityIds = entityParam
      ? entityParam
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : undefined // 如果未提供，則獲取所有實體

    // 呼叫 Home Assistant API 獲取狀態（使用 household 特定配置）
    const states = await getHomeAssistantStates(entityIds, householdId || null)

    // 按設備分組實體
    const devicesMap = new Map<string, {
      id: string
      name: string
      entities: HomeAssistantState[]
      manufacturer?: string
      model?: string
    }>()

    states.forEach((state) => {
      // 嘗試從 attributes 獲取設備信息
      const deviceId = state.attributes?.device_id || state.attributes?.device?.id
      const deviceName = state.attributes?.device?.name || 
                        state.attributes?.device_name ||
                        // 從 friendly_name 推斷設備名稱（例如："米多力除溼機 電源" -> "米多力除溼機"）
                        (state.attributes?.friendly_name 
                          ? state.attributes.friendly_name.split(/\s+/)[0]
                          : state.entity_id.split('.')[0])

      // 如果沒有 device_id，使用推斷的設備名稱作為 key
      const key = deviceId || deviceName

      if (!devicesMap.has(key)) {
        devicesMap.set(key, {
          id: deviceId || key,
          name: deviceName,
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
  } catch (error) {
    console.error('Failed to fetch Home Assistant states:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Home Assistant states' },
      { status: 500 }
    )
  }
}

