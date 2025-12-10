'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useState, useEffect } from 'react'

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

// COMPLETELY PASSIVE APPROACH: Home page does NOT redirect
// RedirectHandler in layout handles all redirects
// This component ONLY renders Dashboard if authenticated, otherwise shows nothing
function ClientHome() {
  // CRITICAL: Check pathname IMMEDIATELY - return null if not on /
  // Also check redirect flag to prevent rendering if redirect is in progress
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    if (currentPath !== '/' && currentPath !== '') {
      return null // Not on home page - don't render anything
    }
    // If redirect was attempted, don't render
    const redirectAttempted = sessionStorage.getItem('smart-warehouse-redirect-attempted')
    if (redirectAttempted === 'true') {
      return null // Redirect in progress, don't render
    }
  }

  const [mounted, setMounted] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Double-check pathname
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      setChecking(false)
      return
    }

    setMounted(true)
    
    // Check session - but DON'T redirect, just set state
    const checkSession = async () => {
      // Final pathname check
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        setChecking(false)
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
            setChecking(false)
            return
          }
          
          if (sessionData.user && sessionData.user.id) {
            // Has session - allow render
            setHasSession(true)
          }
          // No session - don't redirect, just don't render dashboard
        }
      } catch (error) {
        console.error('[ClientHome] Session check error:', error)
        // On error, don't redirect - just don't render
      } finally {
        setChecking(false)
      }
    }
    
    checkSession()
  }, [])

  // Check redirect flag - if redirect was attempted, show nothing
  if (typeof window !== 'undefined') {
    const redirectAttempted = sessionStorage.getItem('smart-warehouse-redirect-attempted')
    if (redirectAttempted === 'true') {
      return null // Redirect in progress, don't show loading
    }
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

  // Final pathname check
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    return null
  }

  // If no session, show nothing - middleware will handle redirect via meta refresh
  if (!hasSession) {
    return null
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
