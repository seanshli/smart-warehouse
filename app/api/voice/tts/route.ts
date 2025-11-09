import { NextResponse } from 'next/server'
import { synthesizeSpeech } from '@/lib/speech-to-text'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const text = typeof body?.text === 'string' ? body.text : ''
    const language = typeof body?.language === 'string' ? body.language : undefined

    if (!text.trim()) {
      return NextResponse.json(
        { audioBase64: null, error: 'Text is required' },
        { status: 400 }
      )
    }

    const audioBase64 = await synthesizeSpeech(text, language)

    return NextResponse.json(
      { audioBase64: audioBase64 ?? null },
      { status: 200 }
    )
  } catch (error) {
    console.error('TTS API error:', error)
    return NextResponse.json(
      { audioBase64: null },
      { status: 200 }
    )
  }
}

