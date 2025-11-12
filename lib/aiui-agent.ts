import crypto from 'crypto'
import { getOpenAI } from './ai'

const AIUI_AGENT_ENDPOINT = 'https://openai.xfyun.cn/v2/aiui'

const AIUI_CONFIG = {
  APP_KEY: process.env.IFLYTEK_APP_KEY || '',
  APP_SECRET: process.env.IFLYTEK_APP_SECRET || '',
}

type AIUIAgentResult = {
  text: string
  source: 'aiui' | 'openai'
  raw?: unknown
}

const LANGUAGE_MAP: Record<string, string> = {
  'zh': 'zh_cn',
  'zh-CN': 'zh_cn',
  'zh-TW': 'zh_tw',
  'en': 'en_us',
  'ja': 'ja_jp',
}

function buildAIUIHeaders(language?: string) {
  if (!AIUI_CONFIG.APP_KEY || !AIUI_CONFIG.APP_SECRET) {
    throw new Error('IFLYTEK credentials are not configured')
  }

  const curTime = Math.floor(Date.now() / 1000).toString()
  const lang = language ? (LANGUAGE_MAP[language] || LANGUAGE_MAP[language.split('-')[0]] || 'en_us') : 'en_us'

  const param = {
    scene: 'main',
    userid: 'smart-warehouse',
    language: lang,
    result_level: 'complete',
  }

  const xParam = Buffer.from(JSON.stringify(param)).toString('base64')
  const checkSum = crypto
    .createHash('md5')
    .update(AIUI_CONFIG.APP_SECRET + curTime + xParam)
    .digest('hex')

  return {
    'Content-Type': 'application/json',
    'X-Appid': AIUI_CONFIG.APP_KEY,
    'X-CurTime': curTime,
    'X-Param': xParam,
    'X-CheckSum': checkSum,
  }
}

async function callAIUI(query: string, language?: string): Promise<AIUIAgentResult | null> {
  if (!AIUI_CONFIG.APP_KEY || !AIUI_CONFIG.APP_SECRET) {
    return null
  }

  try {
    const response = await fetch(AIUI_AGENT_ENDPOINT, {
      method: 'POST',
      headers: buildAIUIHeaders(language),
      body: JSON.stringify({
        text: query,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AIUI chat API error:', response.status, errorText)
      return null
    }

    const result = await response.json()

    // AIUI responses often contain nested result arrays; try to extract the best candidate
    let answer = ''
    if (result?.data?.answer) {
      answer = result.data.answer
    } else if (Array.isArray(result?.data?.result)) {
      const candidates = result.data.result
      for (const candidate of candidates) {
        if (candidate?.intent?.answer) {
          answer = candidate.intent.answer
          break
        }
        if (candidate?.intent?.text) {
          answer = candidate.intent.text
          break
        }
      }
    }

    if (!answer && typeof result?.data === 'string') {
      answer = result.data
    }

    if (!answer) {
      console.warn('AIUI chat returned no answer payload:', result)
      return null
    }

    return {
      text: answer,
      source: 'aiui',
      raw: result,
    }
  } catch (error) {
    console.error('Failed to query AIUI agent:', error)
    return null
  }
}

async function callOpenAI(query: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<AIUIAgentResult | null> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    return null
  }

  try {
    const openai = getOpenAI()
    const messages = [
      { role: 'system', content: 'You are a helpful household inventory assistant. Answer clearly and concisely.' },
      ...history.map((item) => ({ role: item.role, content: item.content })),
      { role: 'user', content: query },
    ]

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.4,
    })

    const text = completion.choices?.[0]?.message?.content?.trim()
    if (!text) {
      return null
    }

    return {
      text,
      source: 'openai',
      raw: completion,
    }
  } catch (error) {
    console.error('OpenAI fallback failed:', error)
    return null
  }
}

export async function queryAIUIAgent(
  query: string,
  language?: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<AIUIAgentResult | null> {
  // Try AIUI first
  const aiuiResult = await callAIUI(query, language)
  if (aiuiResult) {
    return aiuiResult
  }

  // Fallback to OpenAI
  return callOpenAI(query, history)
}

