// Dynamic translation system for scalable item and activity translations
// This system can use AI services or external translation APIs

interface TranslationCache {
  [key: string]: {
    [language: string]: string
  }
}

// In-memory cache for translations to avoid repeated API calls
const translationCache: TranslationCache = {}

// Configuration for translation services
const TRANSLATION_CONFIG = {
  // Set to true to use AI translation (requires OpenAI API key)
  useAI: process.env.OPENAI_API_KEY ? true : false,
  
  // Fallback to hardcoded translations if AI fails
  fallbackToHardcoded: true,
  
  // Cache translations for 24 hours
  cacheExpiry: 24 * 60 * 60 * 1000
}

/**
 * Translate text using OpenAI API
 */
async function translateWithAI(text: string, targetLanguage: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${targetLanguage}. Only return the translation, no explanations or additional text.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content?.trim() || text
  } catch (error) {
    console.error('AI translation error:', error)
    throw error
  }
}

/**
 * Check if translation is cached and still valid
 */
function getCachedTranslation(text: string, targetLanguage: string): string | null {
  const cacheKey = text.toLowerCase().trim()
  const cached = translationCache[cacheKey]?.[targetLanguage]
  
  if (cached) {
    console.log(`Using cached translation for "${text}" -> "${cached}"`)
    return cached
  }
  
  return null
}

/**
 * Cache a translation
 */
function cacheTranslation(text: string, targetLanguage: string, translation: string): void {
  const cacheKey = text.toLowerCase().trim()
  
  if (!translationCache[cacheKey]) {
    translationCache[cacheKey] = {}
  }
  
  translationCache[cacheKey][targetLanguage] = translation
  console.log(`Cached translation: "${text}" -> "${translation}"`)
}

/**
 * Main translation function with fallback system
 */
export async function translateText(
  text: string, 
  targetLanguage: string, 
  fallbackTranslations?: Record<string, string>
): Promise<string> {
  // Return original if already in target language or no translation needed
  if (targetLanguage === 'zhTW' || !text || text.trim().length === 0) {
    return text
  }

  // Check cache first
  const cached = getCachedTranslation(text, targetLanguage)
  if (cached) {
    return cached
  }

  let translation = text

  try {
    // Try AI translation first if enabled
    if (TRANSLATION_CONFIG.useAI) {
      console.log(`Translating with AI: "${text}" -> ${targetLanguage}`)
      translation = await translateWithAI(text, targetLanguage)
    } else {
      throw new Error('AI translation disabled')
    }
  } catch (aiError) {
    console.log(`AI translation failed for "${text}":`, aiError)
    
    // Fallback to hardcoded translations
    if (TRANSLATION_CONFIG.fallbackToHardcoded && fallbackTranslations) {
      translation = fallbackTranslations[text] || text
      console.log(`Using fallback translation for "${text}": "${translation}"`)
    }
  }

  // Cache the result
  if (translation !== text) {
    cacheTranslation(text, targetLanguage, translation)
  }

  return translation
}

/**
 * Batch translate multiple texts (more efficient for API calls)
 */
export async function translateBatch(
  texts: string[],
  targetLanguage: string,
  fallbackTranslations?: Record<string, string>
): Promise<string[]> {
  const results: string[] = []
  const textsToTranslate: { index: number; text: string }[] = []

  // Check cache for all texts first
  texts.forEach((text, index) => {
    const cached = getCachedTranslation(text, targetLanguage)
    if (cached) {
      results[index] = cached
    } else {
      textsToTranslate.push({ index, text })
    }
  })

  // Translate uncached texts
  if (textsToTranslate.length > 0 && TRANSLATION_CONFIG.useAI) {
    try {
      console.log(`Batch translating ${textsToTranslate.length} texts`)
      
      // For now, translate one by one (could be optimized to batch API calls)
      for (const { index, text } of textsToTranslate) {
        const translation = await translateText(text, targetLanguage, fallbackTranslations)
        results[index] = translation
      }
    } catch (error) {
      console.error('Batch translation error:', error)
      
      // Fallback to original texts
      textsToTranslate.forEach(({ index, text }) => {
        results[index] = fallbackTranslations?.[text] || text
      })
    }
  } else {
    // Use fallback translations for uncached texts
    textsToTranslate.forEach(({ index, text }) => {
      results[index] = fallbackTranslations?.[text] || text
    })
  }

  return results
}

/**
 * Get translation statistics
 */
export function getTranslationStats() {
  const totalCached = Object.keys(translationCache).length
  const totalTranslations = Object.values(translationCache)
    .reduce((sum, translations) => sum + Object.keys(translations).length, 0)
  
  return {
    totalCachedTexts: totalCached,
    totalTranslations,
    cacheSize: JSON.stringify(translationCache).length,
    aiEnabled: TRANSLATION_CONFIG.useAI,
    fallbackEnabled: TRANSLATION_CONFIG.fallbackToHardcoded
  }
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
  Object.keys(translationCache).forEach(key => {
    delete translationCache[key]
  })
  console.log('Translation cache cleared')
}
