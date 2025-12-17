// AIUI Transcription API route
// Handles audio transcription using iFLYTEK AIUI (primary) or OpenAI Whisper (fallback)

import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudioFormData } from '@/lib/speech-to-text'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST handler: Transcribe audio to text
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { audioBase64, language } = body as {
      audioBase64?: string // Base64 encoded audio
      language?: string // Language code (optional)
    }

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      )
    }

    // Normalize language code
    const normalizedLanguage = language ? (language.toLowerCase().startsWith('zh') ? 'zh' : language.toLowerCase().split('-')[0]) : undefined

    // Transcribe audio
    const transcript = await transcribeAudioFormData(audioBase64, normalizedLanguage)

    if (!transcript) {
      return NextResponse.json(
        { error: 'Failed to transcribe audio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transcript,
      text: transcript, // Alias for compatibility
      language: normalizedLanguage,
    })
  } catch (error) {
    console.error('Transcription API error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
