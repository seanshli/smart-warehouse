import { NextRequest, NextResponse } from 'next/server'
import { queryAIUIAgent } from '@/lib/aiui-agent'
import { transcribeAudioFormData } from '@/lib/speech-to-text'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { query, audioBase64, language, history } = body as {
      query?: string
      audioBase64?: string
      language?: string
      history?: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    let prompt = typeof query === 'string' ? query.trim() : ''

    if (!prompt && typeof audioBase64 === 'string' && audioBase64.length > 0) {
      try {
        const transcript = await transcribeAudioFormData(audioBase64, language)
        if (transcript) {
          prompt = transcript.trim()
        }
      } catch (error) {
        console.error('Failed to transcribe audio for AIUI chat:', error)
      }
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Query text or audio is required' },
        { status: 400 }
      )
    }

    const conversationHistory = Array.isArray(history)
      ? history.filter(
          (item) =>
            item &&
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.content === 'string'
        )
      : []

    const aiResponse = await queryAIUIAgent(prompt, language, conversationHistory)

    if (!aiResponse) {
      return NextResponse.json(
        {
          query: prompt,
          response: null,
          source: null,
          error: 'AIUI agent unavailable',
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        query: prompt,
        response: aiResponse.text,
        source: aiResponse.source,
        raw: aiResponse.raw ?? undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('AIUI chat route error:', error)
    return NextResponse.json(
      { error: 'Failed to process AIUI chat request' },
      { status: 500 }
    )
  }
}

