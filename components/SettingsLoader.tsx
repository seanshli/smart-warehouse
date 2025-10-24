'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useLanguage } from './LanguageProvider'

export default function SettingsLoader() {
  const { data: session } = useSession()
  const { setTheme } = useTheme()
  const { setLanguage } = useLanguage()

  useEffect(() => {
    const loadGlobalSettings = async () => {
      try {
        // Try to load from database first
        if (session?.user?.email) {
          const response = await fetch('/api/user/preferences')
          if (response.ok) {
            const data = await response.json()
            const preferences = data.preferences
            
            if (preferences) {
              // Apply theme
              if (preferences.theme) {
                setTheme(preferences.theme)
              }
              
              // Apply language
              if (preferences.language) {
                setLanguage(preferences.language)
              }
              
              // Apply font size
              if (preferences.fontSize) {
                const root = document.documentElement
                const fontSize = preferences.fontSize === 'small' ? '14px' : 
                                preferences.fontSize === 'large' ? '18px' : '16px'
                root.style.fontSize = fontSize
              }
              
              return
            }
          }
        }
        
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('smart-warehouse-settings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          
          // Apply theme
          if (parsed.mode) {
            setTheme(parsed.mode)
          }
          
          // Apply language
          if (parsed.language) {
            setLanguage(parsed.language)
          }
          
          // Apply font size
          if (parsed.fontSize) {
            const root = document.documentElement
            const fontSize = parsed.fontSize === 'small' ? '14px' : 
                            parsed.fontSize === 'large' ? '18px' : '16px'
            root.style.fontSize = fontSize
          }
        }
      } catch (error) {
        console.error('Error loading global settings:', error)
      }
    }
    
    loadGlobalSettings()
  }, [session, setTheme, setLanguage])

  return null // This component doesn't render anything
}
