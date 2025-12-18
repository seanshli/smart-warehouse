// iFLYTEK AIUI 代理模組
// 處理與 iFLYTEK AIUI 服務的通訊，提供語音助理功能
// IMPORTANT: AIUI only understands Simplified Chinese (zh)
// All queries must be translated to Simplified Chinese before calling AIUI
// All responses must be translated back to user's selected language

import crypto from 'crypto'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { getOpenAI } from './ai'
import { translateText } from './dynamic-translations'
import { getLanguageConfig, LanguageCode } from './language'

// AIUI 代理端點
const AIUI_AGENT_ENDPOINT = 'https://openai.xfyun.cn/v2/aiui'

// iFLYTEK AIUI 配置
const AIUI_CONFIG = {
  APP_KEY: process.env.IFLYTEK_APP_KEY || '', // 應用程式金鑰
  APP_SECRET: process.env.IFLYTEK_APP_SECRET || '', // 應用程式密鑰
}

// AIUI 裝置序號（用於識別裝置）
const AIUI_DEVICE_SERIAL =
  process.env.AIUI_DEVICE_SERIAL ||
  process.env.NEXT_PUBLIC_AIUI_DEVICE_SERIAL ||
  'SMARTPAD000037'

// AIUI 代理結果類型
type AIUIAgentResult = {
  text: string // 回應文字
  source: 'aiui' | 'openai' // 來源（AIUI 或 OpenAI 備援）
  raw?: unknown // 原始回應（可選）
}

// AIUI only supports Simplified Chinese - always use zh_cn
const AIUI_LANGUAGE = 'zh_cn'

// 構建 AIUI API 請求標頭（包含認證資訊）
// AIUI always uses Simplified Chinese (zh_cn)
function buildAIUIHeaders() {
  if (!AIUI_CONFIG.APP_KEY || !AIUI_CONFIG.APP_SECRET) {
    throw new Error('IFLYTEK credentials are not configured')
  }

  const curTime = Math.floor(Date.now() / 1000).toString() // 當前時間戳（秒）

  // 構建請求參數 - AIUI only supports Simplified Chinese
  const param = {
    scene: 'main', // 場景：主要
    userid: AIUI_DEVICE_SERIAL, // 用戶 ID（使用裝置序號）
    language: AIUI_LANGUAGE, // Always Simplified Chinese
    result_level: 'complete', // 結果級別：完整
    device_id: AIUI_DEVICE_SERIAL, // 裝置 ID
  }

  const xParam = Buffer.from(JSON.stringify(param)).toString('base64') // Base64 編碼參數
  // 計算校驗和（MD5 雜湊）
  const checkSum = crypto
    .createHash('md5')
    .update(AIUI_CONFIG.APP_SECRET + curTime + xParam)
    .digest('hex')

  return {
    'Content-Type': 'application/json',
    'X-Appid': AIUI_CONFIG.APP_KEY, // 應用程式 ID
    'X-CurTime': curTime, // 當前時間
    'X-Param': xParam, // 參數（Base64）
    'X-CheckSum': checkSum, // 校驗和
  }
}

// 呼叫 AIUI 代理 API
// Note: query should already be in Simplified Chinese
async function callAIUI(query: string): Promise<AIUIAgentResult | null> {
  if (!AIUI_CONFIG.APP_KEY || !AIUI_CONFIG.APP_SECRET) {
    return null
  }

  try {
    const response = await fetch(AIUI_AGENT_ENDPOINT, {
      method: 'POST',
      headers: buildAIUIHeaders(), // 構建認證標頭 (always zh_cn)
      body: JSON.stringify({
        text: query, // 查詢文字 (must be Simplified Chinese)
        device_serial: AIUI_DEVICE_SERIAL, // 裝置序號
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AIUI chat API error:', response.status, errorText)
      return null
    }

    const result = await response.json()

    if (typeof result !== 'object' || result === null) {
      console.warn('AIUI chat returned unexpected payload:', result)
      return null
    }

    // 檢查狀態碼
    const statusCode: number | undefined = result.code ?? result.rc ?? result.status
    if (statusCode && statusCode !== 0) {
      console.warn('AIUI chat returned non-zero status:', statusCode, result)
      return null
    }

    // AIUI 回應通常包含嵌套的結果陣列；嘗試提取最佳候選答案
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
      text: answer, // 提取的答案文字
      source: 'aiui', // 來源標記為 AIUI
      raw: result, // 原始回應
    }
  } catch (error) {
    console.error('Failed to query AIUI agent:', error)
    return null
  }
}

// 呼叫 OpenAI 作為備援（當 AIUI 不可用時）
async function callOpenAI(query: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<AIUIAgentResult | null> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    return null
  }

  try {
    const openai = getOpenAI()
    // 將對話歷史轉換為 OpenAI 訊息格式
    const historyMessages: ChatCompletionMessageParam[] = history.map((item) => ({
      role: item.role,
      content: item.content,
    }))

    // 構建訊息陣列（系統提示 + 歷史 + 當前查詢）
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are a helpful household inventory assistant. Answer clearly and concisely.', // 系統提示：家庭庫存助理
      },
      ...historyMessages, // 對話歷史
      { role: 'user', content: query }, // 當前查詢
    ]

    // 呼叫 OpenAI Chat Completions API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini', // 使用配置的模型或預設 gpt-4o-mini
      messages,
      temperature: 0.4, // 溫度參數（控制隨機性）
    })

    const text = completion.choices?.[0]?.message?.content?.trim()
    if (!text) {
      return null
    }

    return {
      text, // OpenAI 回應文字
      source: 'openai', // 來源標記為 OpenAI
      raw: completion, // 原始回應
    }
  } catch (error) {
    console.error('OpenAI fallback failed:', error)
    return null
  }
}

// 查詢 AIUI 代理（主要使用 AIUI，失敗時使用 OpenAI 備援）
// IMPORTANT: AIUI only understands Simplified Chinese (zh)
// - Queries are translated TO Simplified Chinese before calling AIUI
// - Responses are translated FROM Simplified Chinese back to user's selected language
export async function queryAIUIAgent(
  query: string,
  userLanguage: string = 'en', // User's configured/selected language
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<AIUIAgentResult | null> {
  // Get language config for the user's selected language
  const langConfig = getLanguageConfig(userLanguage)
  const isSimplifiedChinese = userLanguage === 'zh' || userLanguage === 'zh-CN'
  
  // Step 1: Translate query to Simplified Chinese if needed
  let queryForAIUI = query
  
  if (!isSimplifiedChinese) {
    try {
      // Translate user's query to Simplified Chinese for AIUI
      queryForAIUI = await translateText(query, '简体中文', {})
      console.log(`[AIUI] Translated query to Simplified Chinese: "${query.substring(0, 50)}..." -> "${queryForAIUI.substring(0, 50)}..."`)
    } catch (error) {
      console.error('[AIUI] Failed to translate query to Simplified Chinese:', error)
      // Continue with original - AIUI may still partially understand
    }
  }
  
  // Step 2: Call AIUI with Simplified Chinese query
  const aiuiResult = await callAIUI(queryForAIUI)
  
  if (aiuiResult) {
    // Step 3: Translate AIUI response back to user's selected language
    let translatedResponse = aiuiResult.text
    
    if (!isSimplifiedChinese) {
      try {
        // Use the language config to get the AI prompt language name
        const targetLangName = langConfig.aiPromptLanguage
        translatedResponse = await translateText(aiuiResult.text, targetLangName, {})
        console.log(`[AIUI] Translated response to ${userLanguage}: "${aiuiResult.text.substring(0, 50)}..." -> "${translatedResponse.substring(0, 50)}..."`)
      } catch (error) {
        console.error('[AIUI] Failed to translate response to user language:', error)
        // Keep Simplified Chinese response if translation fails
      }
    }
    
    return {
      text: translatedResponse,
      source: aiuiResult.source,
      raw: aiuiResult.raw,
    }
  }

  // Fallback to OpenAI (OpenAI understands all languages, no translation needed)
  return callOpenAI(query, history)
}

