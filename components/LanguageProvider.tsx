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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Always load language preference on mount
    if (typeof window !== 'undefined') {
      loadUserLanguagePreference()
      
      // Prevent keyboard language locking on mobile devices
      // Add lang="" to all text inputs to allow free keyboard language switching
      const preventKeyboardLock = () => {
        const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="search"], textarea')
        textInputs.forEach((input) => {
          // Set lang to empty string to allow any keyboard language
          input.setAttribute('lang', '')
          // Also set inputMode appropriately for better mobile experience
          if (!input.getAttribute('inputmode')) {
            const inputType = input.getAttribute('type')
            if (inputType === 'email') {
              input.setAttribute('inputmode', 'email')
            } else if (inputType === 'tel') {
              input.setAttribute('inputmode', 'tel')
            } else if (inputType === 'number') {
              input.setAttribute('inputmode', 'numeric')
            } else {
              // For text inputs, use 'text' to allow language switching
              input.setAttribute('inputmode', 'text')
            }
          }
        })
      }
      
      // Run on mount and whenever inputs are added
      preventKeyboardLock()
      
      // Watch for dynamically added inputs
      const observer = new MutationObserver(preventKeyboardLock)
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
      
      // Also run on focus events to catch any missed inputs
      const handleFocusIn = (e: Event) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          e.target.setAttribute('lang', '')
        }
      }
      document.addEventListener('focusin', handleFocusIn, true)
      
      // Cleanup function
      return () => {
        observer.disconnect()
        document.removeEventListener('focusin', handleFocusIn, true)
      }
    }
  }, []) // Only run once on mount

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
          console.log('LanguageProvider: Loading language from database:', data.language)
          setCurrentLanguageState(data.language)
          saveUserLanguage(data.language)
          // Set HTML lang attribute for content
          if (typeof window !== 'undefined') {
            document.documentElement.lang = data.language
            document.documentElement.setAttribute('data-content-lang', data.language)
          }
          setIsLoading(false)
          return
        }
      }
    } catch (error) {
      console.error('Failed to load user language preference:', error)
    }
    
    // Fallback to detection
    const detectedLanguage = initialLanguage || detectUserLanguage()
    console.log('LanguageProvider: Using detected language:', detectedLanguage)
    setCurrentLanguageState(detectedLanguage)
    // Set HTML lang attribute for content
    if (typeof window !== 'undefined') {
      document.documentElement.lang = detectedLanguage
      document.documentElement.setAttribute('data-content-lang', detectedLanguage)
    }
    setIsLoading(false)
  }

  const setLanguage = (languageCode: string) => {
    console.log('LanguageProvider: Setting language to:', languageCode)
    setCurrentLanguageState(languageCode)
    saveUserLanguage(languageCode)
    
    // Mark that language has been set by user
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart-warehouse-language-set', 'true')
      // Set HTML lang attribute for content language (accessibility)
      document.documentElement.lang = languageCode
      document.documentElement.setAttribute('data-content-lang', languageCode)
      
      // Prevent keyboard language locking on mobile devices
      // Add a data attribute to allow inputs to override keyboard language
      // The CSS will ensure inputs can switch keyboard language freely
    }
    
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
    isLoading: !mounted || isLoading,
    t,
    translations
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{
        currentLanguage: 'en',
        setLanguage: () => {},
        supportedLanguages: SUPPORTED_LANGUAGES,
        isLoading: true,
        t: (key: string) => key,
        translations: {} as any
      }}>
        {children}
      </LanguageContext.Provider>
    )
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
          {lang.nativeName}
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
            {lang.nativeName}
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
