// AIUI 聊天 API 路由
// 處理語音助理的文字和語音輸入，支援 iFLYTEK AIUI 和 OpenAI 備援

import { NextRequest, NextResponse } from 'next/server'
import { queryAIUIAgent } from '@/lib/aiui-agent'
import { transcribeAudioFormData, synthesizeSpeech } from '@/lib/speech-to-text'

export const dynamic = 'force-dynamic' // 強制動態路由

// 標準化語言代碼（將 zh-TW, zh-CN 等轉換為標準格式）
function normalizeLanguageCode(language?: string): string | undefined {
  if (!language) return undefined
  const lower = language.toLowerCase()

  if (lower.startsWith('zh')) {
    return 'zh' // 中文（繁體/簡體）
  }
  if (lower.startsWith('ja')) {
    return 'ja' // 日語
  }
  if (lower.startsWith('en')) {
    return 'en' // 英語
  }
  if (lower.startsWith('es')) {
    return 'es' // 西班牙語
  }
  if (lower.startsWith('fr')) {
    return 'fr' // 法語
  }

  return undefined
}

// POST 處理器：處理聊天請求
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { query, audioBase64, language, history } = body as {
      query?: string // 文字查詢
      audioBase64?: string // Base64 編碼的音訊
      language?: string // 語言代碼
      history?: Array<{ role: 'user' | 'assistant'; content: string }> // 對話歷史
    }

    const normalizedLanguage = normalizeLanguageCode(language) // 標準化語言代碼

    let prompt = typeof query === 'string' ? query.trim() : ''

    // 如果沒有文字查詢但有音訊，先進行語音轉文字
    if (!prompt && typeof audioBase64 === 'string' && audioBase64.length > 0) {
      try {
        const transcript = await transcribeAudioFormData(audioBase64, normalizedLanguage)
        if (transcript) {
          prompt = transcript.trim() // 使用轉錄的文字作為提示
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

    const aiResponse = await queryAIUIAgent(prompt, normalizedLanguage, conversationHistory)

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

    // Generate TTS audio in user's selected language
    let ttsAudioBase64: string | undefined = undefined
    if (aiResponse.text && normalizedLanguage) {
      try {
        const audioResult = await synthesizeSpeech(aiResponse.text, normalizedLanguage)
        ttsAudioBase64 = audioResult || undefined
      } catch (error) {
        console.error('Failed to generate TTS audio:', error)
        // Continue without TTS if it fails
      }
    }

    return NextResponse.json(
      {
        query: prompt,
        response: aiResponse.text,
        source: aiResponse.source,
        raw: aiResponse.raw ?? undefined,
        audioBase64: ttsAudioBase64, // TTS audio in user's language
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

