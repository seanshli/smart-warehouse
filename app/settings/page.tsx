'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  CogIcon, 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  LanguageIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  language: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { currentLanguage, setLanguage, t } = useLanguage()
  const [settings, setSettings] = useState<ThemeSettings>({
    mode: (theme as 'light' | 'dark' | 'system') || 'system',
    fontSize: 'medium',
    language: currentLanguage
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Load settings from database first, then localStorage as fallback
    const loadSettings = async () => {
      try {
        if (session?.user?.email) {
          // Try to load from database
          const response = await fetch('/api/user/preferences')
          if (response.ok) {
            const data = await response.json()
            const dbSettings = {
              mode: data.preferences?.theme || 'system',
              fontSize: data.preferences?.fontSize || 'medium',
              language: data.preferences?.language || 'en'
            }
            setSettings(dbSettings)
            applyThemeSettings(dbSettings)
            return
          }
        }
        
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('smart-warehouse-settings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings(parsed)
          applyThemeSettings(parsed)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('smart-warehouse-settings')
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings)
            setSettings(parsed)
            applyThemeSettings(parsed)
          } catch (e) {
            console.error('Error parsing localStorage settings:', e)
          }
        }
      }
    }
    
    loadSettings()
  }, [session, setTheme, setLanguage])

  const applyThemeSettings = (newSettings: ThemeSettings) => {
    console.log('Applying theme settings:', newSettings)
    
    // Apply theme mode using next-themes
    setTheme(newSettings.mode)
    
    // Apply font size to document root
    const root = document.documentElement
    const fontSize = newSettings.fontSize === 'small' ? '14px' : 
                    newSettings.fontSize === 'large' ? '18px' : '16px'
    root.style.fontSize = fontSize
    
    // Apply language
    setLanguage(newSettings.language)
    
    // Force a re-render to ensure changes take effect
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
      // Also trigger a theme change event
      window.dispatchEvent(new CustomEvent('theme-change', { 
        detail: { theme: newSettings.mode, fontSize: newSettings.fontSize, language: newSettings.language }
      }))
    }, 100)
  }

  const handleSettingChange = (key: keyof ThemeSettings, value: string) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    setHasChanges(true)
    
    // Apply changes immediately for preview
    applyThemeSettings(newSettings)
  }

  const saveSettings = async () => {
    try {
      setIsLoading(true)
      
      // Save to localStorage first
      localStorage.setItem('smart-warehouse-settings', JSON.stringify(settings))
      
      // Save to user preferences in database if logged in
      if (session?.user?.email) {
        const response = await fetch('/api/user/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            theme: settings.mode,
            fontSize: settings.fontSize,
            language: settings.language
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to save to database')
        }
      }
      
      // Apply settings after successful save
      applyThemeSettings(settings)
      
      // Force a page refresh to ensure all components pick up the new settings
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
      setHasChanges(false)
      toast.success('Settings saved successfully! Page will refresh...')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const resetSettings = async () => {
    const defaultSettings = {
      mode: 'system' as const,
      fontSize: 'medium' as const,
      language: 'en'
    }
    setSettings(defaultSettings)
    setHasChanges(true)
    
    // Save the reset settings
    try {
      localStorage.setItem('smart-warehouse-settings', JSON.stringify(defaultSettings))
      
      if (session?.user?.email) {
        await fetch('/api/user/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            theme: defaultSettings.mode,
            fontSize: defaultSettings.fontSize,
            language: defaultSettings.language
          })
        })
      }
      
      applyThemeSettings(defaultSettings)
      setHasChanges(false)
      toast.success('Settings reset to default!')
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error('Failed to reset settings')
    }
  }

  const handleGoToDuplicates = () => {
    window.location.href = '/duplicates'
  }

  const goBack = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to go back?')) {
        router.back()
      }
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header with Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={goBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>
              <div className="flex items-center space-x-2">
                <CogIcon className="h-7 w-7 text-primary-600" />
                <div>
                  <h1 className="text-2xl font-bold">Settings</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Customize your Smart Warehouse experience
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={resetSettings}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Reset
                  </button>
                  <button
                    onClick={saveSettings}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Appearance Settings */}
          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <EyeIcon className="h-5 w-5 text-primary-600" />
              <h2 className="text-xl font-semibold">Appearance</h2>
            </div>
            
            {/* Theme Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleSettingChange('mode', 'light')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                    settings.mode === 'light' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <SunIcon className="h-5 w-5 mr-2" />
                  Light
                </button>
                <button
                  onClick={() => handleSettingChange('mode', 'dark')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                    settings.mode === 'dark' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <MoonIcon className="h-5 w-5 mr-2" />
                  Dark
                </button>
                <button
                  onClick={() => handleSettingChange('mode', 'system')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                    settings.mode === 'system' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <ComputerDesktopIcon className="h-5 w-5 mr-2" />
                  System
                </button>
              </div>
            </div>

            {/* Font Size Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Font Size
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleSettingChange('fontSize', 'small')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                    settings.fontSize === 'small' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                  Small
                </button>
                <button
                  onClick={() => handleSettingChange('fontSize', 'medium')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                    settings.fontSize === 'medium' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                  Medium
                </button>
                <button
                  onClick={() => handleSettingChange('fontSize', 'large')}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                    settings.fontSize === 'large' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                  Large
                </button>
              </div>
            </div>
          </section>

          {/* Language Settings */}
          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <LanguageIcon className="h-5 w-5 text-primary-600" />
              <h2 className="text-xl font-semibold">Language</h2>
            </div>
            <div className="flex items-center space-x-4">
              <label htmlFor="language-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Interface Language:
              </label>
              <select
                id="language-select"
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="en">English</option>
                <option value="zh-TW">繁體中文</option>
                <option value="zh">简体中文</option>
                <option value="ja">日文</option>
              </select>
            </div>
          </section>

          {/* Data Management */}
          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrashIcon className="h-5 w-5 text-primary-600" />
              <h2 className="text-xl font-semibold">Data Management</h2>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Clean up duplicate categories and items to optimize your inventory.
              </p>
              <button
                onClick={handleGoToDuplicates}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                Find and Merge Duplicates
              </button>
            </div>
          </section>

          {/* User Info */}
          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CogIcon className="h-5 w-5 text-primary-600" />
              <h2 className="text-xl font-semibold">Account Information</h2>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Email:</strong> {session?.user?.email}</p>
              <p><strong>Name:</strong> {session?.user?.name}</p>
              <p><strong>Role:</strong> {(session?.user as any)?.isAdmin ? 'Administrator' : 'User'}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}