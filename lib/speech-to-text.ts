import OpenAI from 'openai'
import crypto from 'crypto'

// Initialize OpenAI client lazily
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

// iFLYTEK Configuration
const IFLYTEK_CONFIG = {
  APP_KEY: process.env.IFLYTEK_APP_KEY || '4ba58cf3dc03c31f7262b183a5b1f575',
  APP_SECRET: process.env.IFLYTEK_APP_SECRET || 'OGE5N2MxYzIzNGY4NzE0MTVhOTNkMmU0',
  VERIFY_TOKEN: process.env.IFLYTEK_VERIFY_TOKEN || 'e1fd74d5b0f7c9f8',
  AES_KEY: process.env.IFLYTEK_AES_KEY || '26a6a47e69471bb8',
  // iFLYTEK API endpoints
  ASR_API_URL: 'https://iat-api.xfyun.cn/v2/iat', // Speech Recognition API
  TTS_API_URL: 'https://tts-api.xfyun.cn/v2/tts', // Text-to-Speech API
}

/**
 * Get iFLYTEK authentication token
 * iFLYTEK typically requires authentication via AppKey and AppSecret
 */
function getIFLYTEKAuthHeader(): string {
  const appKey = IFLYTEK_CONFIG.APP_KEY
  const appSecret = IFLYTEK_CONFIG.APP_SECRET
  
  // Generate auth string (typically Base64 encoded appKey:appSecret)
  const authString = Buffer.from(`${appKey}:${appSecret}`).toString('base64')
  return `Basic ${authString}`
}

/**
 * Generate X-Param for iFLYTEK API
 * Note: X-Param should NOT include the audio data in the base64 string
 */
function generateIFLYTEKParam(language: string = 'zh_cn'): string {
  const param = {
    common: {
      app_id: IFLYTEK_CONFIG.APP_KEY,
    },
    business: {
      language: language, // zh_cn, en_us, etc.
      domain: 'iat', // internet audio transcription
      accent: 'mandarin', // or 'cantonese' for Chinese
      vad_eos: 10000, // end of speech detection timeout
    },
    data: {
      status: 2, // 2 = last chunk, 1 = middle chunk, 0 = first chunk
      format: 'audio/L16;rate=16000', // audio format
      encoding: 'raw', // or 'opus', 'webm', etc.
      // audio field is NOT included in X-Param, it's sent in the request body
    },
  }
  
  return Buffer.from(JSON.stringify(param)).toString('base64')
}

/**
 * Transcribe audio using iFLYTEK ASR API (Primary)
 */
async function transcribeWithIFLYTEK(
  audioBase64: string,
  language?: string
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

    // Map language codes to iFLYTEK format
    const languageMap: Record<string, string> = {
      'zh': 'zh_cn',
      'zh-TW': 'zh_cn',
      'zh-CN': 'zh_cn',
      'en': 'en_us',
      'ja': 'ja_jp',
    }
    const iflytekLang = language ? languageMap[language] || 'zh_cn' : 'zh_cn'

    // Generate X-Param and X-CurTime
    const curTime = Math.floor(Date.now() / 1000).toString()
    const xParam = generateIFLYTEKParam(iflytekLang)
    
    // Generate X-CheckSum for authentication
    // Format: MD5(APP_KEY + APP_SECRET + X-CurTime + X-Param)
    const xCheckSum = crypto
      .createHash('md5')
      .update(IFLYTEK_CONFIG.APP_KEY + IFLYTEK_CONFIG.APP_SECRET + curTime + xParam)
      .digest('hex')

    // Convert audio to proper format for iFLYTEK
    // iFLYTEK typically expects PCM16, 16kHz, mono
    // For now, we'll send the audio as-is and let iFLYTEK handle conversion
    const audioBuffer = Buffer.from(base64Data, 'base64')

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
          format: 'audio/L16;rate=16000', // iFLYTEK expects PCM16, 16kHz
          encoding: 'raw',
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
  // Node.js 18+ has File API
  if (typeof File !== 'undefined') {
    return new File([buffer], filename, { type: mimeType })
  }
  
  // Fallback for older Node.js versions: Create a File-like object from Blob
  if (typeof Blob !== 'undefined') {
    const blob = new Blob([buffer], { type: mimeType })
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
 */
export async function transcribeAudio(
  audioBase64: string,
  language?: string
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

    // Use OpenAI Whisper API for transcription
    const openai = getOpenAIClient()
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language || undefined, // Optional: 'en', 'zh', 'ja', etc.
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
 */
async function transcribeWithOpenAI(
  audioBase64: string,
  language?: string
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

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language || undefined,
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
 */
export async function transcribeAudioFormData(
  audioBase64: string,
  language?: string
): Promise<string | null> {
  // Try iFLYTEK first (primary)
  console.log('Attempting transcription with iFLYTEK...')
  let transcript = await transcribeWithIFLYTEK(audioBase64, language)
  
  if (transcript && transcript.trim().length > 0) {
    console.log('✓ iFLYTEK transcription successful')
    return transcript.trim()
  }

  // Fallback to OpenAI if iFLYTEK fails
  console.log('iFLYTEK transcription failed or empty, falling back to OpenAI...')
  transcript = await transcribeWithOpenAI(audioBase64, language)
  
  if (transcript && transcript.trim().length > 0) {
    console.log('✓ OpenAI transcription successful (fallback)')
    return transcript.trim()
  }

  console.warn('Both transcription engines failed')
  return null
}

