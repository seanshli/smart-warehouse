// Home Assistant API 輔助模組
// 提供與 Home Assistant 實例通訊的函數

import { prisma } from './prisma'

/**
 * 獲取 household 的 Home Assistant 配置
 * @param householdId Household ID（必需，每個 household 必須有自己的配置）
 * @returns Home Assistant 配置或 null（如果沒有配置）
 */
export async function getHomeAssistantConfig(householdId?: string | null) {
  if (!householdId) {
    // 不再使用全局配置，每個 household 必須有自己的配置
    return null
  }

  try {
    const config = await prisma.homeAssistantConfig.findUnique({
      where: { householdId },
    })

    if (config) {
      return {
        baseUrl: config.baseUrl,
        accessToken: config.accessToken,
      }
    }
  } catch (error) {
    console.error('Error fetching Home Assistant config:', error)
  }

  // 如果沒有找到 household 特定配置，返回 null（不再回退到全局配置）
  return null
}

/**
 * 呼叫 Home Assistant API
 * @param path API 路徑（相對於基礎 URL）
 * @param init 請求初始化選項
 * @param householdId 可選的 household ID，用於獲取特定配置
 * @returns API 回應資料
 */
export async function callHomeAssistant<T = unknown>(
  path: string,
  init: RequestInit = {},
  householdId?: string | null
): Promise<T> {
  const config = await getHomeAssistantConfig(householdId)

  if (!config.baseUrl || !config.accessToken) {
    throw new Error('Home Assistant credentials are not configured')
  }

  const url = new URL(path, config.baseUrl)

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.accessToken}`, // 使用 Bearer Token 認證
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
  attributes: Record<string, any> // 屬性字典，包含 device_id, friendly_name 等
  last_changed: string // 最後變更時間
  last_updated: string // 最後更新時間
}

// Home Assistant 設備信息類型定義
export type HomeAssistantDevice = {
  id: string // 設備 ID
  name: string // 設備名稱
  entities: HomeAssistantState[] // 該設備的所有實體
  manufacturer?: string // 製造商
  model?: string // 型號
}

/**
 * 獲取 Home Assistant 實體狀態
 * @param entityIds 實體 ID 陣列（可選，不提供則獲取所有實體）
 * @param householdId 可選的 household ID，用於獲取特定配置
 * @returns 實體狀態陣列
 */
export async function getHomeAssistantStates(
  entityIds?: string[],
  householdId?: string | null
): Promise<HomeAssistantState[]> {
  if (entityIds && entityIds.length > 0) {
    // 批量獲取指定實體的狀態
    const results: HomeAssistantState[] = []
    for (const entityId of entityIds) {
      try {
        const state = await callHomeAssistant<HomeAssistantState>(
          `/api/states/${entityId}`,
          {},
          householdId
        )
        results.push(state)
      } catch (error) {
        console.error('Failed to fetch Home Assistant entity', entityId, error)
      }
    }
    return results
  }

  // 獲取所有實體狀態
  return callHomeAssistant<HomeAssistantState[]>('/api/states', {}, householdId)
}

/**
 * 呼叫 Home Assistant 服務
 * @param domain 服務領域（如 'light', 'switch', 'climate'）
 * @param service 服務名稱（如 'turn_on', 'turn_off'）
 * @param payload 服務載荷（參數）
 * @param householdId 可選的 household ID，用於獲取特定配置
 * @returns 服務呼叫結果
 */
export async function callHomeAssistantService<
  TPayload extends Record<string, any> = Record<string, any>
>(
  domain: string,
  service: string,
  payload: TPayload,
  householdId?: string | null
): Promise<unknown> {
  return callHomeAssistant(
    `/api/services/${domain}/${service}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    householdId
  )
}

