'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { detectUserLanguage, saveUserLanguage, SUPPORTED_LANGUAGES, LanguageInfo } from '@/lib/language'
import { useTranslations, Translations } from '@/lib/translations'

interface LanguageContextType {
  currentLanguage: string
  setLanguage: (languageCode: string) => void
  supportedLanguages: LanguageInfo[]
  isLoading: boolean
  t: (key: keyof Translations) => string
  translations: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

interface LanguageProviderProps {
  children: React.ReactNode
  initialLanguage?: string
}

export default function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguageState] = useState<string>('en')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load user's language preference from database first, then fallback to detection
    loadUserLanguagePreference()
  }, [initialLanguage])

  const loadUserLanguagePreference = async () => {
    try {
      // Try to get user's language preference from database
      const response = await fetch('/api/user/language', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.language && SUPPORTED_LANGUAGES.some(lang => lang.code === data.language)) {
          setCurrentLanguageState(data.language)
          saveUserLanguage(data.language)
          setIsLoading(false)
          return
        }
      }
    } catch (error) {
      console.error('Failed to load user language preference:', error)
    }
    
    // Fallback to detection
    const detectedLanguage = initialLanguage || detectUserLanguage()
    setCurrentLanguageState(detectedLanguage)
    setIsLoading(false)
  }

  const setLanguage = (languageCode: string) => {
    setCurrentLanguageState(languageCode)
    saveUserLanguage(languageCode)
    
    // Update user language preference in database
    updateUserLanguagePreference(languageCode)
    
    // Force a small delay to ensure state is updated before components re-render
    setTimeout(() => {
      // Trigger a re-render by updating a dummy state
      setCurrentLanguageState(prev => prev === languageCode ? languageCode : languageCode)
    }, 100)
  }

  const updateUserLanguagePreference = async (languageCode: string) => {
    try {
      await fetch('/api/user/language', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ language: languageCode })
      })
    } catch (error) {
      console.error('Failed to update user language preference:', error)
    }
  }

  const { t, translations } = useTranslations(currentLanguage)

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isLoading,
    t,
    translations
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

// Language selector component
export function LanguageSelector() {
  const { currentLanguage, setLanguage, supportedLanguages, isLoading } = useLanguage()

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
    )
  }

  return (
    <select
      value={currentLanguage}
      onChange={(e) => setLanguage(e.target.value)}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
    >
      {supportedLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName} ({lang.name})
        </option>
      ))}
    </select>
  )
}

// Compact language selector for headers/navbars
export function CompactLanguageSelector() {
  const { currentLanguage, setLanguage, supportedLanguages, isLoading } = useLanguage()

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
    )
  }

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage)

  return (
    <div className="relative">
      <select
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value)}
        className="appearance-none bg-transparent border-none text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none cursor-pointer"
        title={`Current language: ${currentLang?.nativeName || currentLanguage}`}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.code.toUpperCase()}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
  )
}
