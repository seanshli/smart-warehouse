const HOME_ASSISTANT_BASE_URL = process.env.HOME_ASSISTANT_BASE_URL
const HOME_ASSISTANT_TOKEN = process.env.HOME_ASSISTANT_ACCESS_TOKEN

if (!HOME_ASSISTANT_BASE_URL) {
  console.warn('HOME_ASSISTANT_BASE_URL is not configured')
}

if (!HOME_ASSISTANT_TOKEN) {
  console.warn('HOME_ASSISTANT_ACCESS_TOKEN is not configured')
}

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
      Authorization: `Bearer ${HOME_ASSISTANT_TOKEN}`,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Home Assistant request failed: ${response.status} ${response.statusText} - ${errorText}`
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export type HomeAssistantState = {
  entity_id: string
  state: string
  attributes: Record<string, any>
  last_changed: string
  last_updated: string
}

export async function getHomeAssistantStates(
  entityIds?: string[]
): Promise<HomeAssistantState[]> {
  if (entityIds && entityIds.length > 0) {
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

  return callHomeAssistant<HomeAssistantState[]>('/api/states')
}

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

