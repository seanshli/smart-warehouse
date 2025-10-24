'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useLanguage } from './LanguageProvider'

export default function SettingsLoader() {
  const { data: session, status } = useSession()
  const { setTheme } = useTheme()
  const { setLanguage } = useLanguage()
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    // Only load settings once and after session is determined
    if (settingsLoaded) return
    
    const loadGlobalSettings = async () => {
      try {
        // Clear any cached session data on app restart to force fresh login
        const lastSessionTime = localStorage.getItem('last-session-time')
        const now = Date.now()
        if (!lastSessionTime || now - parseInt(lastSessionTime) > 24 * 60 * 60 * 1000) {
          // Session is older than 24 hours, clear cached data
          localStorage.removeItem('next-auth.session-token')
          localStorage.removeItem('next-auth.csrf-token')
          localStorage.setItem('last-session-time', now.toString())
        }
        
        // Wait a bit for the session to be fully loaded
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Try to load from database first if user is authenticated
        if (status === 'authenticated' && session?.user?.email) {
          try {
            const response = await fetch('/api/user/preferences')
            if (response.ok) {
              const data = await response.json()
              const preferences = data.preferences
              
              if (preferences) {
                console.log('Loading settings from database:', preferences)
                
                // Apply theme
                if (preferences.theme && preferences.theme !== 'system') {
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
                
                setSettingsLoaded(true)
                return
              }
            }
          } catch (dbError) {
            console.log('Database settings not available, falling back to localStorage')
          }
        }
        
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('smart-warehouse-settings')
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings)
            console.log('Loading settings from localStorage:', parsed)
            
            // Apply theme
            if (parsed.mode && parsed.mode !== 'system') {
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
          } catch (parseError) {
            console.error('Error parsing localStorage settings:', parseError)
          }
        }
        
        setSettingsLoaded(true)
      } catch (error) {
        console.error('Error loading global settings:', error)
        setSettingsLoaded(true)
      }
    }
    
    loadGlobalSettings()
  }, [session, status, setTheme, setLanguage, settingsLoaded])

  // Listen for theme changes from settings page
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const { theme, fontSize, language } = event.detail
      console.log('Theme change event received:', { theme, fontSize, language })
      
      if (theme && theme !== 'system') {
        setTheme(theme)
      }
      
      if (language) {
        setLanguage(language)
      }
      
      if (fontSize) {
        const root = document.documentElement
        const fontSizeValue = fontSize === 'small' ? '14px' : 
                            fontSize === 'large' ? '18px' : '16px'
        root.style.fontSize = fontSizeValue
      }
    }

    window.addEventListener('theme-change', handleThemeChange as EventListener)
    
    return () => {
      window.removeEventListener('theme-change', handleThemeChange as EventListener)
    }
  }, [setTheme, setLanguage])

  return null // This component doesn't render anything
}
