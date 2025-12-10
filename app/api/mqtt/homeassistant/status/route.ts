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
    const baseUrl = searchParams.get('baseUrl')
    const accessToken = searchParams.get('accessToken')

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
      // 確定要使用的 baseUrl 和 accessToken
      let finalBaseUrl = baseUrl
      let finalAccessToken = accessToken
      
      // 如果沒有提供，嘗試從 household 配置獲取
      if (!finalBaseUrl || !finalAccessToken) {
        if (householdId) {
          const { getHomeAssistantConfig } = await import('@/lib/homeassistant')
          const haConfig = await getHomeAssistantConfig(householdId)
          if (haConfig) {
            finalBaseUrl = finalBaseUrl || haConfig.baseUrl
            finalAccessToken = finalAccessToken || haConfig.accessToken
          }
        }
      }
      
      // 如果還是沒有，返回錯誤
      if (!finalBaseUrl || !finalAccessToken) {
        return NextResponse.json({
          connected: false,
          status: 'offline',
          error: 'Home Assistant credentials are not configured',
        })
      }
      
      // 直接使用提供的 baseUrl 和 accessToken 進行連接測試
      const url = new URL('/api/config', finalBaseUrl)
      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${finalAccessToken}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json({
          connected: false,
          status: 'offline',
          error: `Home Assistant request failed: ${response.status} ${response.statusText} - ${errorText}`,
        })
      }

      const config = await response.json() as {
        location_name: string
        version: string
        time_zone: string
      }

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
    } finally {
      // 恢復原始環境變數
      if (baseUrl) {
        process.env.HOME_ASSISTANT_BASE_URL = originalBaseUrl
      }
      if (accessToken) {
        process.env.HOME_ASSISTANT_ACCESS_TOKEN = originalToken
      }
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

