'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  language: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { currentLanguage, setLanguage, t } = useLanguage()
  const [settings, setSettings] = useState<ThemeSettings>({
    mode: 'system',
    fontSize: 'medium',
    language: currentLanguage
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('smart-warehouse-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
        applyThemeSettings(parsed)
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }, [])

  const applyThemeSettings = (newSettings: ThemeSettings) => {
    const root = document.documentElement
    
    // Apply theme mode
    if (newSettings.mode === 'dark') {
      root.classList.add('dark')
    } else if (newSettings.mode === 'light') {
      root.classList.remove('dark')
    } else {
      // System mode - let CSS handle it
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
    root.style.fontSize = fontSizeMap[newSettings.fontSize]
  }

  const saveSettings = async (newSettings: ThemeSettings) => {
    setIsLoading(true)
    try {
      // Save to localStorage
      localStorage.setItem('smart-warehouse-settings', JSON.stringify(newSettings))
      
      // Apply settings immediately
      applyThemeSettings(newSettings)
      
      // Update language if changed
      if (newSettings.language !== currentLanguage) {
        setLanguage(newSettings.language)
      }
      
      setSettings(newSettings)
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    const newSettings = { ...settings, mode }
    saveSettings(newSettings)
  }

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    const newSettings = { ...settings, fontSize }
    saveSettings(newSettings)
  }

  const handleLanguageChange = (language: string) => {
    const newSettings = { ...settings, language }
    saveSettings(newSettings)
  }

  const handleCleanupDuplicates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/cleanup-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`Cleaned up ${result.removedCount} duplicate categories`)
      } else {
        const errorData = await response.json()
        toast.error(`Failed to cleanup duplicates: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error cleaning up duplicates:', error)
      toast.error('An error occurred while cleaning up duplicates')
    } finally {
      setIsLoading(false)
    }
  }

  const resetSettings = () => {
    const defaultSettings: ThemeSettings = {
      mode: 'system',
      fontSize: 'medium',
      language: 'en'
    }
    saveSettings(defaultSettings)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <CogIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">Customize your Smart Warehouse experience</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Theme Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <EyeIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Appearance</h2>
            </div>

            {/* Theme Mode */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Theme Mode
              </label>
              <div className="space-y-3">
                {[
                  { value: 'light', label: 'Light', icon: SunIcon },
                  { value: 'dark', label: 'Dark', icon: MoonIcon },
                  { value: 'system', label: 'System', icon: ComputerDesktopIcon }
                ].map(({ value, label, icon: Icon }) => (
                  <label key={value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value={value}
                      checked={settings.mode === value}
                      onChange={() => handleThemeChange(value as any)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <Icon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Font Size
              </label>
              <div className="space-y-3">
                {[
                  { value: 'small', label: 'Small', description: '14px' },
                  { value: 'medium', label: 'Medium', description: '16px' },
                  { value: 'large', label: 'Large', description: '18px' }
                ].map(({ value, label, description }) => (
                  <label key={value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="fontSize"
                      value={value}
                      checked={settings.fontSize === value}
                      onChange={() => handleFontSizeChange(value as any)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                    <span className="text-xs text-gray-500">({description})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <LanguageIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Language</h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interface Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="en">English</option>
                <option value="zh-TW">繁體中文</option>
                <option value="zh">简体中文</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <TrashIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Duplicate Cleanup
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Remove duplicate categories and items from your inventory.
                </p>
                <button
                  onClick={handleCleanupDuplicates}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  {isLoading ? 'Cleaning...' : 'Clean Duplicates'}
                </button>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <AdjustmentsHorizontalIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">System</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Reset Settings
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Reset all settings to their default values.
                </p>
                <button
                  onClick={resetSettings}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Settings Display */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Theme:</span>
              <span className="ml-2 text-gray-600 capitalize">{settings.mode}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Font Size:</span>
              <span className="ml-2 text-gray-600 capitalize">{settings.fontSize}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Language:</span>
              <span className="ml-2 text-gray-600">{settings.language}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
