'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useState, useEffect, useRef } from 'react'

// Dynamically import Dashboard with no SSR to avoid hydration issues
const Dashboard = dynamic(() => import('@/components/warehouse/Dashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  ),
})

// BYPASS APPROACH: Use sessionStorage to completely disable home page when navigating to signin
// This prevents any interference with the signin page in Capacitor
const BYPASS_KEY = 'smart-warehouse-bypass-home'

function ClientHome() {
  // CRITICAL BYPASS: Check sessionStorage FIRST - if bypass is set, return null immediately
  // This completely disables the home page component when navigating to signin
  if (typeof window !== 'undefined') {
    const bypass = sessionStorage.getItem(BYPASS_KEY)
    if (bypass === 'true') {
      // Bypass is active - don't run ANY logic, return null immediately
      return null
    }
    
    const currentPath = window.location.pathname
    // If not on home page, return null immediately AND set bypass flag
    if (currentPath !== '/' && currentPath !== '') {
      // Set bypass flag to prevent this component from running on other routes
      sessionStorage.setItem(BYPASS_KEY, 'true')
      return null
    }
    // If on home page, clear bypass flag
    if (currentPath === '/') {
      sessionStorage.removeItem(BYPASS_KEY)
    }
  }

  const [mounted, setMounted] = useState(false)
  const [checking, setChecking] = useState(true)
  const hasCheckedRef = useRef(false)
  const redirectAttemptedRef = useRef(false)

  useEffect(() => {
    // CRITICAL: Check bypass flag again in useEffect
    if (typeof window !== 'undefined') {
      const bypass = sessionStorage.getItem(BYPASS_KEY)
      if (bypass === 'true') {
        return // Don't run any logic if bypass is set
      }
    }

    // CRITICAL: If we've already checked or attempted redirect, don't run again
    if (hasCheckedRef.current || redirectAttemptedRef.current) {
      return
    }

    // CRITICAL: Check pathname BEFORE setting mounted state
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      if (currentPath !== '/' && currentPath !== '') {
        // Not on home page - set bypass and return
        sessionStorage.setItem(BYPASS_KEY, 'true')
        hasCheckedRef.current = true
        setChecking(false)
        return
      }
    }

    setMounted(true)
    hasCheckedRef.current = true
    
    // Check session immediately - redirect if no session
    const checkAndRedirect = async () => {
      // Check bypass flag again
      if (typeof window !== 'undefined') {
        const bypass = sessionStorage.getItem(BYPASS_KEY)
        if (bypass === 'true') {
          setChecking(false)
          return
        }
      }

      // Final pathname check before doing anything
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        sessionStorage.setItem(BYPASS_KEY, 'true')
        setChecking(false)
        return
      }

      // Prevent multiple redirect attempts
      if (redirectAttemptedRef.current) {
        return
      }

      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (response.ok) {
          const sessionData = await response.json()
          // Final check we're still on home page
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            sessionStorage.setItem(BYPASS_KEY, 'true')
            setChecking(false)
            return
          }
          
          if (!sessionData.user || !sessionData.user.id) {
            // No session - set bypass flag and redirect to signin
            if (!redirectAttemptedRef.current && typeof window !== 'undefined') {
              redirectAttemptedRef.current = true
              sessionStorage.setItem(BYPASS_KEY, 'true') // Set bypass BEFORE redirect
              console.log('[ClientHome] No session, redirecting to signin')
              window.location.replace('/auth/signin')
            }
            return
          }
          // Has session - allow render
          setChecking(false)
        } else {
          // Session check failed - set bypass and redirect to signin
          if (!redirectAttemptedRef.current && typeof window !== 'undefined') {
            redirectAttemptedRef.current = true
            sessionStorage.setItem(BYPASS_KEY, 'true') // Set bypass BEFORE redirect
            console.log('[ClientHome] Session check failed, redirecting to signin')
            window.location.replace('/auth/signin')
          }
        }
      } catch (error) {
        console.error('[ClientHome] Session check error:', error)
        // On error, set bypass and redirect to signin
        if (!redirectAttemptedRef.current && typeof window !== 'undefined') {
          redirectAttemptedRef.current = true
          sessionStorage.setItem(BYPASS_KEY, 'true') // Set bypass BEFORE redirect
          window.location.replace('/auth/signin')
        }
      }
    }
    
    // Run check immediately
    checkAndRedirect()
  }, [])

  // Check bypass flag before rendering anything
  if (typeof window !== 'undefined' && sessionStorage.getItem(BYPASS_KEY) === 'true') {
    return null
  }

  // If redirect attempted, show nothing (redirect is in progress)
  if (redirectAttemptedRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show loading while checking
  if (!mounted || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Final check pathname before rendering
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    if (currentPath !== '/' && currentPath !== '') {
      sessionStorage.setItem(BYPASS_KEY, 'true')
      return null
    }
  }

  // User is authenticated - show dashboard
  return (
    <div className="min-h-screen">
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </div>
  )
}

export default function Home() {
  return <ClientHome />
}
