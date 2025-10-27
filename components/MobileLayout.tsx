'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from './LanguageProvider'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'unknown'>('unknown')
  const [mounted, setMounted] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setMounted(true)
    
    const checkDevice = () => {
      if (typeof window === 'undefined') return
      
      const userAgent = navigator.userAgent.toLowerCase()
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)
      
      if (isIOS) {
        setDeviceType('ios')
      } else if (isAndroid) {
        setDeviceType('android')
      } else {
        setDeviceType('unknown')
      }

      // Check screen size
      const width = window.innerWidth
      const height = window.innerHeight
      
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      
      // Determine orientation
      setOrientation(width > height ? 'landscape' : 'portrait')
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  // Apply device-specific classes
  const getLayoutClasses = () => {
    let classes = 'min-h-screen-safe'
    
    if (isMobile) {
      classes += ' mobile-layout'
      if (orientation === 'landscape') {
        classes += ' mobile-landscape'
      } else {
        classes += ' mobile-portrait'
      }
    } else if (isTablet) {
      classes += ' tablet-layout'
      if (orientation === 'landscape') {
        classes += ' tablet-landscape'
      } else {
        classes += ' tablet-portrait'
      }
    } else {
      classes += ' desktop-layout'
    }

    // Device-specific classes
    if (deviceType === 'ios') {
      classes += ' ios-device'
    } else if (deviceType === 'android') {
      classes += ' android-device'
    }

    return classes
  }

  // Prevent hydration mismatch by not rendering device-specific content until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen-safe">
        {children}
      </div>
    )
  }

  return (
    <div className={getLayoutClasses()}>
      {/* Device info for debugging - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 z-50 rounded-bl-lg">
          <div>Device: {deviceType}</div>
          <div>Size: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</div>
          <div>Orientation: {orientation}</div>
          <div>Screen: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '0x0'}</div>
        </div>
      )}
      
      {children}
    </div>
  )
}

// Hook for device detection
export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    orientation: 'portrait' as 'portrait' | 'landscape',
    deviceType: 'unknown' as 'ios' | 'android' | 'unknown',
    screenWidth: 0,
    screenHeight: 0,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const updateDeviceInfo = () => {
      if (typeof window === 'undefined') return
      
      const userAgent = navigator.userAgent.toLowerCase()
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)
      
      const width = window.innerWidth
      const height = window.innerHeight
      
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        orientation: width > height ? 'landscape' : 'portrait',
        deviceType: isIOS ? 'ios' : isAndroid ? 'android' : 'unknown',
        screenWidth: width,
        screenHeight: height,
      })
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  // Return default values during SSR to prevent hydration mismatch
  if (!mounted) {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      orientation: 'portrait' as 'portrait' | 'landscape',
      deviceType: 'unknown' as 'ios' | 'android' | 'unknown',
      screenWidth: 1024,
      screenHeight: 768,
    }
  }

  return deviceInfo
}
