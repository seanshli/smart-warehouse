import { NextRequest, NextResponse } from 'next/server'
import { callHomeAssistantService } from '@/lib/homeassistant'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string; service: string } }
) {
  try {
    const payload = await request.json()
    const result = await callHomeAssistantService(
      params.domain,
      params.service,
      payload || {}
    )

    return NextResponse.json(
      {
        success: true,
        result,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      `Failed to call Home Assistant service ${params.domain}.${params.service}:`,
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

