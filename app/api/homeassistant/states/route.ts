// Home Assistant 狀態 API 路由
// 代理 Home Assistant 實體狀態查詢請求

import { NextRequest, NextResponse } from 'next/server'
import { getHomeAssistantStates } from '@/lib/homeassistant'

export const dynamic = 'force-dynamic' // 強制動態路由

// GET 處理器：獲取 Home Assistant 實體狀態
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entityParam = searchParams.get('entity_ids') // 從查詢參數獲取實體 ID 列表
    
    // 解析實體 ID 列表（格式：entity_id1,entity_id2,...）
    const entityIds = entityParam
      ? entityParam
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : undefined // 如果未提供，則獲取所有實體

    // 呼叫 Home Assistant API 獲取狀態
    const states = await getHomeAssistantStates(entityIds)

    return NextResponse.json(
      {
        states, // 返回實體狀態陣列
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

