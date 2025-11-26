// Language detection and management utilities

export interface LanguageInfo {
  code: string // ISO 639-1 code (e.g., 'en', 'zh', 'ja')
  name: string // Display name (e.g., 'English', '中文', '日本語')
  nativeName: string // Native name (e.g., 'English', '中文', '日本語')
}

// Supported languages with their metadata
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-TW', name: '繁體中文', nativeName: '繁體中文' },
  { code: 'zh', name: '简体中文', nativeName: '简体中文' },
  { code: 'ja', name: '日文', nativeName: '日文' },
  { code: 'ko', name: '한국어', nativeName: '한국어' },
  { code: 'es', name: 'Español', nativeName: 'Español' },
  { code: 'fr', name: 'Français', nativeName: 'Français' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano' },
  { code: 'pt', name: 'Português', nativeName: 'Português' },
  { code: 'ru', name: 'Русский', nativeName: 'Русский' },
  { code: 'ar', name: 'العربية', nativeName: 'العربية' },
  { code: 'hi', name: 'हिन्दी', nativeName: 'हिन्दी' },
  { code: 'th', name: 'ไทย', nativeName: 'ไทย' },
  { code: 'vi', name: 'Tiếng Việt', nativeName: 'Tiếng Việt' },
]

// Get language info by code
export function getLanguageInfo(code: string): LanguageInfo | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code)
}

// Detect user's preferred language from browser/system
export function detectUserLanguage(): string {
  if (typeof window === 'undefined') {
    return 'en' // Default for server-side
  }

  // Try to get from localStorage first (user preference)
  const savedLanguage = localStorage.getItem('preferred-language')
  if (savedLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLanguage)) {
    return savedLanguage
  }

  // Get from browser language preferences
  const browserLanguages = navigator.languages || [navigator.language]
  
  for (const lang of browserLanguages) {
    // Extract base language code (e.g., 'en-US' -> 'en')
    const baseLang = lang.split('-')[0]
    
    // Check for exact match first
    if (SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
      return lang
    }
    
    // Check for base language match
    if (SUPPORTED_LANGUAGES.some(l => l.code === baseLang)) {
      return baseLang
    }
  }

  // Special handling for Chinese variants
  if (browserLanguages.some(lang => lang.startsWith('zh'))) {
    // Check if it's Simplified Chinese (CN)
    if (browserLanguages.some(lang => lang.includes('CN') || lang.includes('SG'))) {
      return 'zh'
    }
    // Default to Traditional Chinese (TW, HK, or generic zh)
    return 'zh-TW'
  }

  return 'en' // Default fallback
}

// Save user's language preference
export function saveUserLanguage(languageCode: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred-language', languageCode)
  }
}

// Get display name for a language code
export function getLanguageDisplayName(code: string): string {
  const lang = getLanguageInfo(code)
  return lang ? lang.nativeName : code.toUpperCase()
}

// Check if a language is supported
export function isLanguageSupported(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code)
}

// Get language-specific AI prompts
export function getLanguageSpecificPrompt(languageCode: string): string {
  const prompts: Record<string, string> = {
    'en': 'Respond in English.',
    'zh': '请用简体中文回答。',
    'zh-TW': '請用繁體中文回答。',
    'ja': '日本語で回答してください。',
    'ko': '한국어로 답변해주세요.',
    'es': 'Responde en español.',
    'fr': 'Répondez en français.',
    'de': 'Antworten Sie auf Deutsch.',
    'it': 'Rispondi in italiano.',
    'pt': 'Responda em português.',
    'ru': 'Ответьте на русском языке.',
    'ar': 'أجب باللغة العربية.',
    'hi': 'हिंदी में उत्तर दें।',
    'th': 'ตอบเป็นภาษาไทย',
    'vi': 'Trả lời bằng tiếng Việt.',
  }
  
  return prompts[languageCode] || prompts['en']
}

// Format language for display
export function formatLanguageForDisplay(code: string): string {
  const lang = getLanguageInfo(code)
  if (!lang) return code.toUpperCase()
  
  return `${lang.nativeName} (${lang.name})`
}
