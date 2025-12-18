// 語音轉文字模組
// 支援 iFLYTEK AIUI（主要）和 OpenAI Whisper（備援）兩種語音識別引擎
// Language handling: Uses user's configured language for speech recognition

import OpenAI from 'openai'
import crypto from 'crypto'
import { getServiceLanguageCode } from './language'

// 延遲初始化 OpenAI 客戶端
let openai: OpenAI | null = null

// 獲取 OpenAI 客戶端實例
function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY
    
    // Check if API key is missing or is a placeholder
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your-openai-api-key') {
      // During build time (Next.js build phase), allow missing API key
      const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                          process.env.NEXT_PHASE === 'phase-development-build' ||
                          process.env.NEXT_PHASE === 'phase-export' ||
                          // Also check for Vercel build environment
                          process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production' && !apiKey
      
      if (isBuildTime) {
        // Return a dummy client during build - actual API calls will fail at runtime if key is missing
        console.warn('[Build] OPENAI_API_KEY not configured - build will continue but API features will not work at runtime')
        return new OpenAI({
          apiKey: 'dummy-key-for-build-only-do-not-use',
        })
      }
      
      // At runtime, throw error if API key is missing
      throw new Error('OPENAI_API_KEY environment variable is not set. Please configure it in your environment variables.')
    }
    
    // Initialize OpenAI client with the actual API key
    openai = new OpenAI({
      apiKey: apiKey.trim(),
    })
  }
  return openai
}

// iFLYTEK（科大訊飛）配置
const IFLYTEK_CONFIG = {
  APP_KEY: process.env.IFLYTEK_APP_KEY || '4ba58cf3dc03c31f7262b183a5b1f575', // 應用程式金鑰
  APP_SECRET: process.env.IFLYTEK_APP_SECRET || 'OGE5N2MxYzIzNGY4NzE0MTVhOTNkMmU0', // 應用程式密鑰
  VERIFY_TOKEN: process.env.IFLYTEK_VERIFY_TOKEN || 'e1fd74d5b0f7c9f8', // 驗證令牌
  AES_KEY: process.env.IFLYTEK_AES_KEY || '26a6a47e69471bb8', // AES 加密金鑰
  // iFLYTEK API 端點
  ASR_API_URL: 'https://iat-api.xfyun.cn/v2/iat', // 語音識別 API
  TTS_API_URL: 'https://tts-api.xfyun.cn/v2/tts', // 文字轉語音 API
}

// AIUI 裝置序號（用於識別裝置）
const AIUI_DEVICE_SERIAL =
  process.env.AIUI_DEVICE_SERIAL ||
  process.env.NEXT_PUBLIC_AIUI_DEVICE_SERIAL ||
  'SMARTPAD000037'

/**
 * 獲取 iFLYTEK 認證標頭
 * iFLYTEK 通常需要通過 AppKey 和 AppSecret 進行認證
 */
function getIFLYTEKAuthHeader(): string {
  const appKey = IFLYTEK_CONFIG.APP_KEY
  const appSecret = IFLYTEK_CONFIG.APP_SECRET
  
  // 生成認證字串（通常是 Base64 編碼的 appKey:appSecret）
  const authString = Buffer.from(`${appKey}:${appSecret}`).toString('base64')
  return `Basic ${authString}`
}

// 檢測音訊格式（自動識別音訊編碼格式）
function detectAudioFormat(audioBase64: string): { format: string; encoding: string } {
  let format = 'audio/L16;rate=16000' // 預設格式：PCM 16-bit，16kHz
  let encoding = 'raw' // 預設編碼：原始 PCM

  try {
    if (audioBase64.startsWith('data:')) {
      const header = audioBase64.slice(5, audioBase64.indexOf(';'))
      const normalized = header.toLowerCase()

      if (normalized.includes('webm')) {
        // Browser MediaRecorder default
        format = 'audio/webm;codecs=opus'
        encoding = 'opus'
      } else if (normalized.includes('ogg')) {
        format = 'audio/ogg;codecs=opus'
        encoding = 'opus'
      } else if (normalized.includes('mp3') || normalized.includes('mpeg')) {
        format = 'audio/mpeg'
        encoding = 'mp3'
      } else if (normalized.includes('wav') || normalized.includes('x-wav')) {
        format = 'audio/wav'
        encoding = 'wav'
      } else if (normalized.includes('m4a') || normalized.includes('mp4')) {
        format = 'audio/mp4'
        encoding = 'mp4'
      }
    }
  } catch (error) {
    console.warn('Failed to detect audio format, falling back to PCM16:', error)
  }

  return { format, encoding }
}

/**
 * Generate X-Param for iFLYTEK API
 * Note: X-Param should NOT include the audio data in the base64 string
 * @param iflytekLanguage - iFLYTEK language code (zh_tw, zh_cn, en_us, ja_jp)
 */
function generateIFLYTEKParam(
  iflytekLanguage: string = 'en_us', // Default to English for internal coding
  format?: string,
  encoding?: string
): string {
  const param = {
    common: {
      app_id: IFLYTEK_CONFIG.APP_KEY,
      device_id: AIUI_DEVICE_SERIAL,
      uid: AIUI_DEVICE_SERIAL,
    },
    business: {
      language: iflytekLanguage, // zh_cn, zh_tw, en_us, ja_jp
      domain: 'iat', // internet audio transcription
      accent: 'mandarin', // or 'cantonese' for Chinese
      vad_eos: 10000, // end of speech detection timeout
      serial_no: AIUI_DEVICE_SERIAL,
    },
    data: {
      status: 2, // 2 = last chunk, 1 = middle chunk, 0 = first chunk
      format: format || 'audio/L16;rate=16000', // audio format
      encoding: encoding || 'raw', // or 'opus', 'webm', etc.
      // audio field is NOT included in X-Param, it's sent in the request body
    },
  }
  
  return Buffer.from(JSON.stringify(param)).toString('base64')
}

/**
 * Transcribe audio using iFLYTEK ASR API (Primary)
 * @param audioBase64 - Base64 encoded audio data
 * @param userLanguage - User's configured language (en, zh-TW, zh, ja)
 */
async function transcribeWithIFLYTEK(
  audioBase64: string,
  userLanguage: string = 'en' // Default to English for internal coding
): Promise<string | null> {
  try {
    // Check if iFLYTEK is configured
    if (!IFLYTEK_CONFIG.APP_KEY || IFLYTEK_CONFIG.APP_KEY === 'your-iflytek-app-key') {
      console.warn('iFLYTEK not configured - will use fallback')
      return null
    }

    // Remove data URL prefix if present
    const base64Data = audioBase64.includes(',') 
      ? audioBase64.split(',')[1] 
      : audioBase64

    // Use LANGUAGE_CONFIG to get iFLYTEK-specific language code
    const iflytekLang = getServiceLanguageCode(userLanguage, 'iflytek')

    const { format: detectedFormat, encoding: detectedEncoding } = detectAudioFormat(audioBase64)

    // Generate X-Param and X-CurTime
    const curTime = Math.floor(Date.now() / 1000).toString()
    const xParam = generateIFLYTEKParam(iflytekLang, detectedFormat, detectedEncoding)
    
    // Generate X-CheckSum for authentication
    // Format: MD5(APP_KEY + APP_SECRET + X-CurTime + X-Param)
    const xCheckSum = crypto
      .createHash('md5')
      .update(IFLYTEK_CONFIG.APP_KEY + IFLYTEK_CONFIG.APP_SECRET + curTime + xParam)
      .digest('hex')

    // Use iFLYTEK REST API for transcription
    // Note: iFLYTEK also supports WebSocket for real-time, but REST is simpler for our use case
    const response = await fetch('https://iat-api.xfyun.cn/v2/iat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appid': IFLYTEK_CONFIG.APP_KEY,
        'X-CurTime': curTime,
        'X-Param': xParam,
        'X-CheckSum': xCheckSum,
      },
      body: JSON.stringify({
        data: {
          status: 2, // last chunk
          format: detectedFormat,
          encoding: detectedEncoding,
          audio: base64Data,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('iFLYTEK API error:', response.status, errorText)
      return null
    }

    const result = await response.json()
    
    // Parse iFLYTEK response
    // Response format: { code: 0, message: 'success', data: { result: { ws: [...] } } }
    if (result.code === 0 && result.data?.result) {
      // Extract text from result
      const ws = result.data.result.ws || []
      let transcript = ''
      
      for (const item of ws) {
        if (item.cw && item.cw.length > 0) {
          transcript += item.cw[0].w || ''
        }
      }
      
      return transcript.trim()
    }

    console.error('iFLYTEK transcription failed:', result)
    return null
  } catch (error) {
    console.error('iFLYTEK transcription error:', error)
    return null
  }
}

// Create a File object from Buffer for Node.js
// Node.js 18+ has native File API support
function createFileFromBuffer(buffer: Buffer, filename: string, mimeType: string): File {
  // Convert Buffer to Uint8Array for compatibility
  const uint8Array = new Uint8Array(buffer)
  
  // Node.js 18+ has File API
  if (typeof File !== 'undefined') {
    return new File([uint8Array], filename, { type: mimeType })
  }
  
  // Fallback for older Node.js versions: Create a File-like object from Blob
  if (typeof Blob !== 'undefined') {
    const blob = new Blob([uint8Array], { type: mimeType })
    return Object.assign(blob, {
      name: filename,
      lastModified: Date.now()
    }) as File
  }
  
  // Ultimate fallback: return buffer as-is (OpenAI SDK may handle it)
  return buffer as any
}

/**
 * Transcribe audio to text using OpenAI Whisper API
 * Supports multiple audio formats and languages
 * @param audioBase64 - Base64 encoded audio data
 * @param userLanguage - User's configured language (en, zh-TW, zh, ja)
 */
export async function transcribeAudio(
  audioBase64: string,
  userLanguage: string = 'en' // Default to English for internal coding
): Promise<string | null> {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    console.warn('OpenAI API key not configured - speech-to-text unavailable')
    return null
  }

  try {
    // Remove data URL prefix if present (data:audio/webm;codecs=opus;base64,...)
    const base64Data = audioBase64.includes(',') 
      ? audioBase64.split(',')[1] 
      : audioBase64

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(base64Data, 'base64')

    // Create a File object for OpenAI API (Node.js 18+ compatible)
    const audioFile = createFileFromBuffer(audioBuffer, 'audio.webm', 'audio/webm')

    // Use LANGUAGE_CONFIG to get Whisper-specific language code
    const whisperLang = getServiceLanguageCode(userLanguage, 'whisper')

    // Use OpenAI Whisper API for transcription
    const openai = getOpenAIClient()
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: whisperLang || undefined, // Use configured language
      response_format: 'text', // Simple text response
      temperature: 0.0, // More deterministic transcription
    })

    // Handle different response formats
    if (typeof transcription === 'string') {
      return transcription.trim()
    } else if (typeof transcription === 'object' && 'text' in transcription) {
      return (transcription as any).text.trim()
    }

    return null
  } catch (error) {
    console.error('Speech-to-text transcription error:', error)
    // Don't throw - transcription failure shouldn't break the app
    return null
  }
}

/**
 * Transcribe audio using OpenAI Whisper API (Fallback)
 * @param audioBase64 - Base64 encoded audio data
 * @param userLanguage - User's configured language (en, zh-TW, zh, ja)
 */
async function transcribeWithOpenAI(
  audioBase64: string,
  userLanguage: string = 'en' // Default to English for internal coding
): Promise<string | null> {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    console.warn('OpenAI API key not configured - speech-to-text unavailable')
    return null
  }

  try {
    // Remove data URL prefix if present
    const base64Data = audioBase64.includes(',') 
      ? audioBase64.split(',')[1] 
      : audioBase64

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(base64Data, 'base64')

    // Use OpenAI SDK with File API
    const openai = getOpenAIClient()
    
    // Create a File object compatible with OpenAI SDK
    const audioFile = createFileFromBuffer(audioBuffer, 'audio.webm', 'audio/webm')

    // Use LANGUAGE_CONFIG to get Whisper-specific language code
    const whisperLang = getServiceLanguageCode(userLanguage, 'whisper')

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: whisperLang || undefined,
      response_format: 'text',
      temperature: 0.0,
    })

    // Handle response
    if (typeof transcription === 'string') {
      return transcription.trim()
    } else if (typeof transcription === 'object' && 'text' in transcription) {
      return (transcription as any).text.trim()
    }

    return null
  } catch (error) {
    console.error('OpenAI transcription error:', error)
    return null
  }
}

/**
 * Main transcription function with dual engine support
 * Primary: iFLYTEK, Fallback: OpenAI
 * @param audioBase64 - Base64 encoded audio data
 * @param userLanguage - User's configured language (en, zh-TW, zh, ja)
 */
export async function transcribeAudioFormData(
  audioBase64: string,
  userLanguage: string = 'en' // Default to English for internal coding
): Promise<string | null> {
  // Try iFLYTEK first (primary)
  console.log(`Attempting transcription with iFLYTEK (language: ${userLanguage})...`)
  let transcript = await transcribeWithIFLYTEK(audioBase64, userLanguage)
  
  if (transcript && transcript.trim().length > 0) {
    console.log('✓ iFLYTEK transcription successful')
    return transcript.trim()
  }

  // Fallback to OpenAI if iFLYTEK fails
  console.log('iFLYTEK transcription failed or empty, falling back to OpenAI...')
  transcript = await transcribeWithOpenAI(audioBase64, userLanguage)
  
  if (transcript && transcript.trim().length > 0) {
    console.log('✓ OpenAI transcription successful (fallback)')
    return transcript.trim()
  }

  console.warn('Both transcription engines failed')
  return null
}

// Voice mapping for TTS based on user's configured language
function getIFLYTEKVoiceForLanguage(userLanguage: string = 'en'): string {
  // Map user language to appropriate iFLYTEK voice
  const voiceMap: Record<string, string> = {
    'en': 'aisxping',      // English voice
    'zh-TW': 'xiaoyan',    // Traditional Chinese voice
    'zh': 'xiaoyan',       // Simplified Chinese voice
    'ja': 'aisjinky',      // Japanese voice
  }
  return voiceMap[userLanguage] || 'aisxping' // Default to English voice
}

function generateIFLYTEKTTSParam(voice: string, userLanguage: string = 'en'): string {
  // Use LANGUAGE_CONFIG to get iFLYTEK-specific language code
  const iflytekLang = getServiceLanguageCode(userLanguage, 'iflytek')
  
  const param = {
    auf: 'audio/L16;rate=16000',
    aue: 'lame',
    voice_name: voice,
    engine_type: 'intp65',
    speed: 50,
    pitch: 50,
    volume: 77,
    text_type: 'text',
    language: iflytekLang,
    serial_no: AIUI_DEVICE_SERIAL,
  }

  return Buffer.from(JSON.stringify(param)).toString('base64')
}

/**
 * Synthesize speech using iFLYTEK TTS API
 * @param text - Text to synthesize
 * @param userLanguage - User's configured language (en, zh-TW, zh, ja)
 */
async function synthesizeWithIFLYTEK(text: string, userLanguage: string = 'en'): Promise<string | null> {
  if (!text || !text.trim()) {
    return null
  }

  try {
    if (!IFLYTEK_CONFIG.APP_KEY || IFLYTEK_CONFIG.APP_KEY === 'your-iflytek-app-key') {
      console.warn('iFLYTEK TTS not configured - skipping')
      return null
    }

    const sanitizedText = text.trim()
    const voice = getIFLYTEKVoiceForLanguage(userLanguage)
    const curTime = Math.floor(Date.now() / 1000).toString()
    const paramsBase64 = generateIFLYTEKTTSParam(voice, userLanguage)
    const textBase64 = Buffer.from(sanitizedText, 'utf-8').toString('base64')

    const checkSum = crypto
      .createHash('md5')
      .update(IFLYTEK_CONFIG.APP_KEY + curTime + paramsBase64 + textBase64)
      .digest('hex')

    const response = await fetch(IFLYTEK_CONFIG.TTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-Appid': IFLYTEK_CONFIG.APP_KEY,
        'X-CurTime': curTime,
        'X-Param': paramsBase64,
        'X-CheckSum': checkSum,
      },
      body: new URLSearchParams({ text: textBase64 }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('iFLYTEK TTS API error:', response.status, errorText)
      return null
    }

    const result = await response.json()

    if (result.code === 0 && result.data?.audio) {
      return result.data.audio as string
    }

    console.error('iFLYTEK TTS failed:', result)
    return null
  } catch (error) {
    console.error('iFLYTEK TTS error:', error)
    return null
  }
}

/**
 * Synthesize text to speech
 * @param text - Text to synthesize
 * @param userLanguage - User's configured language (en, zh-TW, zh, ja)
 */
export async function synthesizeSpeech(
  text: string,
  userLanguage: string = 'en' // Default to English for internal coding
): Promise<string | null> {
  const audioBase64 = await synthesizeWithIFLYTEK(text, userLanguage)

  if (audioBase64 && audioBase64.length > 0) {
    return audioBase64
  }

  return null
}

