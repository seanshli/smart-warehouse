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
        // Only clear session data if it's been more than 24 hours
        const lastSessionTime = localStorage.getItem('last-session-time')
        const now = Date.now()
        const sessionAge = lastSessionTime ? now - parseInt(lastSessionTime) : Infinity
        
        // Force fresh login if session is older than 24 hours
        if (!lastSessionTime || sessionAge > 24 * 60 * 60 * 1000) {
          console.log('Clearing session data to force fresh login')
          localStorage.removeItem('next-auth.session-token')
          localStorage.removeItem('next-auth.csrf-token')
          localStorage.removeItem('next-auth.callback-url')
          localStorage.setItem('last-session-time', now.toString())
        }
        
        // Wait a bit for the session to be fully loaded
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check if settings have already been applied (to avoid overriding user changes)
        const hasRecentSettings = localStorage.getItem('smart-warehouse-settings-applied')
        if (hasRecentSettings) {
          const appliedTime = parseInt(hasRecentSettings)
          // If settings were applied within the last 5 minutes, don't override them
          if (Date.now() - appliedTime < 5 * 60 * 1000) {
            console.log('Recent settings detected, skipping auto-load')
            setSettingsLoaded(true)
            return
          }
        }
        
        // Try to load from database first if user is authenticated
        if (status === 'authenticated' && session?.user?.email) {
          try {
            const response = await fetch('/api/user/preferences')
            if (response.ok) {
              const data = await response.json()
              const preferences = data.preferences
              
              if (preferences) {
                console.log('Loading settings from database:', preferences)
                
                // Apply theme (always apply, even if 'system')
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
            
            // Apply theme (always apply, even if 'system')
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
      
      // Always apply theme, even if 'system'
      if (theme) {
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
