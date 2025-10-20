import { useState, useCallback } from 'react'

interface TranslationCache {
  [key: string]: string
}

const translationCache: TranslationCache = {}

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false)

  const translateText = useCallback(async (
    text: string, 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<string> => {
    if (!text || !targetLanguage) return text
    
    // If source and target are the same, return original text
    if (sourceLanguage === targetLanguage) return text
    
    // Check cache first
    const cacheKey = `${text}:${targetLanguage}:${sourceLanguage || 'auto'}`
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey]
    }

    try {
      setIsTranslating(true)
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage
        })
      })

      if (response.ok) {
        const data = await response.json()
        const translatedText = data.translatedText || text
        
        // Cache the result
        translationCache[cacheKey] = translatedText
        
        return translatedText
      } else {
        console.error('Translation API error:', await response.text())
        return text
      }
    } catch (error) {
      console.error('Translation error:', error)
      return text
    } finally {
      setIsTranslating(false)
    }
  }, [])

  const translateBatch = useCallback(async (
    texts: string[], 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<string[]> => {
    if (!texts.length || !targetLanguage) return texts
    
    // If source and target are the same, return original texts
    if (sourceLanguage === targetLanguage) return texts

    const results: string[] = []
    
    for (const text of texts) {
      const translated = await translateText(text, targetLanguage, sourceLanguage)
      results.push(translated)
    }
    
    return results
  }, [translateText])

  return {
    translateText,
    translateBatch,
    isTranslating
  }
}
