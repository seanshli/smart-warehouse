// Home Assistant 事件流 API 路由
// 透過 WebSocket 代理 Home Assistant 的狀態變更事件，以 Server-Sent Events (SSE) 形式傳送給客戶端
// 實現即時同步 Home Assistant 裝置狀態

import { NextRequest } from 'next/server'
import WebSocket from 'ws'
import { getHomeAssistantConfig } from '@/lib/homeassistant'

export const runtime = 'nodejs' // 使用 Node.js 運行時（WebSocket 需要）

// GET 處理器：建立 SSE 事件流
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const householdId = searchParams.get('householdId') // 從查詢參數獲取 householdId
  const entitiesParam = searchParams.get('entities') // 從查詢參數獲取要監聽的實體 ID 列表
  
  // 獲取 household 特定的 Home Assistant 配置
  const config = await getHomeAssistantConfig(householdId || null)
  
  if (!config || !config.baseUrl || !config.accessToken) {
    return new Response('Home Assistant credentials not configured for this household', {
      status: 400,
    })
  }
  
  const BASE_URL = config.baseUrl
  const ACCESS_TOKEN = config.accessToken
  
  // 解析實體 ID 集合（格式：entity_id1,entity_id2,...）
  const entitySet = new Set(
    entitiesParam
      ? entitiesParam
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [] // 如果未提供，則監聽所有實體
  )

  // 將 HTTP URL 轉換為 WebSocket URL
  const wsUrl = BASE_URL.replace(/^http/i, 'ws') + '/api/websocket'

  // 建立可讀流（用於 SSE）
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      let authenticated = false // 認證狀態
      let subscriptionId = 1 // 訂閱 ID

      // 建立 WebSocket 連線到 Home Assistant
      const websocket = new WebSocket(wsUrl)

      // 關閉流的輔助函數
      const closeStream = () => {
        try {
          websocket.close()
        } catch (error) {
          console.error('Error closing Home Assistant websocket:', error)
        }
        controller.close()
      }

      // WebSocket 連線開啟
      websocket.on('open', () => {
        // 連線已開啟；等待 auth_required 訊息
      })

      // 處理 WebSocket 訊息
      websocket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())

          // 處理認證請求
          if (message.type === 'auth_required') {
            websocket.send(
              JSON.stringify({
                type: 'auth',
                access_token: ACCESS_TOKEN,
              })
            )
          } 
          // 認證成功，訂閱狀態變更事件
          else if (message.type === 'auth_ok') {
            authenticated = true
            websocket.send(
              JSON.stringify({
                id: subscriptionId,
                type: 'subscribe_events',
                event_type: 'state_changed', // 訂閱狀態變更事件
              })
            )
          } 
          // 認證失敗
          else if (message.type === 'auth_invalid') {
            console.error('Home Assistant authentication failed:', message)
            closeStream()
          } 
          // 處理狀態變更事件
          else if (
            message.type === 'event' &&
            message.event?.data?.entity_id
          ) {
            const entityId = message.event.data.entity_id
            // 如果未指定實體或實體在監聽列表中，則轉發事件
            if (entitySet.size === 0 || entitySet.has(entityId)) {
              const payload = {
                entity_id: entityId, // 實體 ID
                new_state: message.event.data.new_state, // 新狀態
                old_state: message.event.data.old_state, // 舊狀態
                time_fired: message.event.time_fired, // 事件觸發時間
              }
              // 以 SSE 格式發送事件
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
              )
            }
          }
        } catch (error) {
          console.error('Error processing Home Assistant event:', error)
        }
      })

      // WebSocket 錯誤處理
      websocket.on('error', (error) => {
        console.error('Home Assistant websocket error:', error)
        closeStream()
      })

      // WebSocket 關閉處理
      websocket.on('close', () => {
        controller.enqueue(new TextEncoder().encode('event: close\ndata: {}\n\n'))
        closeStream()
      })

      // 如果客戶端斷開連線，終止 Home Assistant WebSocket
      request.signal.addEventListener('abort', () => {
        closeStream()
      })
    },
  })

  // 返回 SSE 響應
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream', // SSE 內容類型
      'Cache-Control': 'no-cache, no-transform', // 禁用快取
      Connection: 'keep-alive', // 保持連線
      'X-Accel-Buffering': 'no', // 禁用代理緩衝
    },
  })
}

