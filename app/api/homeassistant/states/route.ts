import { NextRequest, NextResponse } from 'next/server'
import { getHomeAssistantStates } from '@/lib/homeassistant'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entityParam = searchParams.get('entity_ids')
    const entityIds = entityParam
      ? entityParam
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : undefined

    const states = await getHomeAssistantStates(entityIds)

    return NextResponse.json(
      {
        states,
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

