// Home Assistant 服務呼叫 API 路由
// 代理 Home Assistant 服務呼叫請求（如 light.turn_on, switch.turn_off 等）

import { NextRequest, NextResponse } from 'next/server'
import { callHomeAssistantService } from '@/lib/homeassistant'

export const dynamic = 'force-dynamic' // 強制動態路由

// POST 處理器：呼叫 Home Assistant 服務
// @param domain - 服務領域（如 'light', 'switch', 'climate'）
// @param service - 服務名稱（如 'turn_on', 'turn_off'）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string; service: string }> }
) {
  try {
    const { domain, service } = await params
    const body = await request.json() // 從請求體獲取服務參數
    const householdId = body.householdId || null // 從請求體獲取 household ID（可選）
    
    // 移除 householdId 從 payload，因為它不是 HA API 的參數
    const { householdId: _, ...payload } = body
    
    // 呼叫 Home Assistant 服務（使用 household 特定配置）
    const result = await callHomeAssistantService(
      domain, // 服務領域
      service, // 服務名稱
      payload || {}, // 服務載荷（參數）
      householdId // household ID
    )

    return NextResponse.json(
      {
        success: true,
        result, // 服務呼叫結果
      },
      { status: 200 }
    )
  } catch (error) {
    const { domain, service } = await params
    console.error(
      `Failed to call Home Assistant service ${domain}.${service}:`,
      error
    )
    return NextResponse.json(
      {
        error: 'Failed to call Home Assistant service',
      },
      { status: 500 }
    )
  }
}

