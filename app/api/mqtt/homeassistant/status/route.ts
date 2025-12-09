// Home Assistant 連接狀態 API 路由
// 檢查 Home Assistant 連接狀態

import { NextRequest, NextResponse } from 'next/server'
import { callHomeAssistant } from '@/lib/homeassistant'

export const dynamic = 'force-dynamic'

// GET 處理器：檢查 Home Assistant 連接狀態
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const householdId = searchParams.get('householdId')

    // 嘗試獲取 Home Assistant 配置信息來檢查連接
    try {
      const config = await callHomeAssistant<{
        location_name: string
        version: string
        time_zone: string
      }>('/api/config', {}, householdId || null)

      return NextResponse.json({
        connected: true,
        status: 'online',
        location: config.location_name,
        version: config.version,
        timezone: config.time_zone,
      })
    } catch (error: any) {
      return NextResponse.json({
        connected: false,
        status: 'offline',
        error: error.message || 'Failed to connect to Home Assistant',
      })
    }
  } catch (error: any) {
    console.error('Failed to check Home Assistant status:', error)
    return NextResponse.json(
      {
        connected: false,
        status: 'error',
        error: error.message || 'Failed to check connection status',
      },
      { status: 500 }
    )
  }
}

