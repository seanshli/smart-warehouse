// Home Assistant API 輔助模組
// 提供與 Home Assistant 實例通訊的函數

// 從環境變數讀取 Home Assistant 配置
const HOME_ASSISTANT_BASE_URL = process.env.HOME_ASSISTANT_BASE_URL // Home Assistant 基礎 URL
const HOME_ASSISTANT_TOKEN = process.env.HOME_ASSISTANT_ACCESS_TOKEN // 長期存取令牌

if (!HOME_ASSISTANT_BASE_URL) {
  console.warn('HOME_ASSISTANT_BASE_URL is not configured')
}

if (!HOME_ASSISTANT_TOKEN) {
  console.warn('HOME_ASSISTANT_ACCESS_TOKEN is not configured')
}

/**
 * 呼叫 Home Assistant API
 * @param path API 路徑（相對於基礎 URL）
 * @param init 請求初始化選項
 * @returns API 回應資料
 */
export async function callHomeAssistant<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!HOME_ASSISTANT_BASE_URL || !HOME_ASSISTANT_TOKEN) {
    throw new Error('Home Assistant credentials are not configured')
  }

  const url = new URL(path, HOME_ASSISTANT_BASE_URL)

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HOME_ASSISTANT_TOKEN}`, // 使用 Bearer Token 認證
      ...(init.headers || {}),
    },
    cache: 'no-store', // 不使用快取
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Home Assistant request failed: ${response.status} ${response.statusText} - ${errorText}`
    )
  }

  if (response.status === 204) {
    return undefined as T // 204 No Content 回應
  }

  return (await response.json()) as T
}

// Home Assistant 實體狀態類型定義
export type HomeAssistantState = {
  entity_id: string // 實體 ID
  state: string // 狀態值
  attributes: Record<string, any> // 屬性字典
  last_changed: string // 最後變更時間
  last_updated: string // 最後更新時間
}

/**
 * 獲取 Home Assistant 實體狀態
 * @param entityIds 實體 ID 陣列（可選，不提供則獲取所有實體）
 * @returns 實體狀態陣列
 */
export async function getHomeAssistantStates(
  entityIds?: string[]
): Promise<HomeAssistantState[]> {
  if (entityIds && entityIds.length > 0) {
    // 批量獲取指定實體的狀態
    const results: HomeAssistantState[] = []
    for (const entityId of entityIds) {
      try {
        const state = await callHomeAssistant<HomeAssistantState>(
          `/api/states/${entityId}`
        )
        results.push(state)
      } catch (error) {
        console.error('Failed to fetch Home Assistant entity', entityId, error)
      }
    }
    return results
  }

  // 獲取所有實體狀態
  return callHomeAssistant<HomeAssistantState[]>('/api/states')
}

/**
 * 呼叫 Home Assistant 服務
 * @param domain 服務領域（如 'light', 'switch', 'climate'）
 * @param service 服務名稱（如 'turn_on', 'turn_off'）
 * @param payload 服務載荷（參數）
 * @returns 服務呼叫結果
 */
export async function callHomeAssistantService<
  TPayload extends Record<string, any> = Record<string, any>
>(
  domain: string,
  service: string,
  payload: TPayload
): Promise<unknown> {
  return callHomeAssistant(`/api/services/${domain}/${service}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

