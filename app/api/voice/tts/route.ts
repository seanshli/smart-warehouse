import { NextRequest, NextResponse } from 'next/server'
import { synthesizeSpeech } from '@/lib/speech-to-text'

export const dynamic = 'force-dynamic'

interface TTSRequestBody {
  text?: string
  voice?: string
  speed?: number
  pitch?: number
  volume?: number
  language?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TTSRequestBody

    if (!body?.text || body.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required for synthesis' },
        { status: 400 }
      )
    }

    const audioResult = await synthesizeSpeech(body.text, {
      voice: body.voice,
      speed: body.speed,
      pitch: body.pitch,
      volume: body.volume,
      language: body.language,
    })

    if (!audioResult) {
      // Return 200 with null payload so the client can fall back to the browser Speech API
      return NextResponse.json({ audioBase64: null }, { status: 200 })
    }

    return NextResponse.json({
      audioBase64: audioResult.audioBase64,
      format: audioResult.format,
    })
  } catch (error) {
    console.error('TTS API error:', error)
    return NextResponse.json(
      { error: 'Text-to-speech synthesis failed' },
      { status: 500 }
    )
  }
}

