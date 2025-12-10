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

const REDIRECT_KEY = 'smart-warehouse-redirect-attempted'

// COMPLETELY SELF-CONTAINED: Home page handles its own redirect
// NO external RedirectHandler - everything happens here
function ClientHome() {
  const redirectAttemptedRef = useRef(false)
  const hasCheckedRef = useRef(false)
  
  // CRITICAL: Check pathname IMMEDIATELY - return null if not on /
  // This MUST be the first thing checked before ANY React hooks or state
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    // If not on home page, return null IMMEDIATELY - don't run ANY logic
    if (currentPath !== '/' && currentPath !== '') {
      return null
    }
  }

  const [mounted, setMounted] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // CRITICAL: Only run once
    if (hasCheckedRef.current) {
      return
    }
    hasCheckedRef.current = true

    // CRITICAL: Check pathname BEFORE doing anything
    if (typeof window === 'undefined') {
      return
    }

    if (window.location.pathname !== '/') {
      setChecking(false)
      return
    }

    // Check redirect flag
    const redirectAttempted = sessionStorage.getItem(REDIRECT_KEY)
    if (redirectAttempted === 'true') {
      setChecking(false)
      return
    }

    setMounted(true)
    
    // Check session and handle redirect if needed
    const checkSession = async () => {
      // Final pathname check
      if (window.location.pathname !== '/') {
        setChecking(false)
        return
      }

      // Check redirect flag again
      const redirectAttempted = sessionStorage.getItem(REDIRECT_KEY)
      if (redirectAttempted === 'true') {
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
          
          // CRITICAL: Final check we're still on home page
          if (window.location.pathname !== '/') {
            setChecking(false)
            return
          }
          
          // Check redirect flag one more time
          const redirectAttempted = sessionStorage.getItem(REDIRECT_KEY)
          if (redirectAttempted === 'true') {
            setChecking(false)
            return
          }
          
          if (sessionData.user && sessionData.user.id) {
            // Has session - allow render
            setHasSession(true)
            // Clear redirect flag if it exists
            sessionStorage.removeItem(REDIRECT_KEY)
          } else {
            // No session - redirect to signin
            if (!redirectAttemptedRef.current) {
              redirectAttemptedRef.current = true
              sessionStorage.setItem(REDIRECT_KEY, 'true')
              console.log('[ClientHome] No session, redirecting to signin')
              window.location.replace('/auth/signin')
            }
          }
        } else {
          // Response not ok - redirect to signin
          if (!redirectAttemptedRef.current && window.location.pathname === '/') {
            redirectAttemptedRef.current = true
            sessionStorage.setItem(REDIRECT_KEY, 'true')
            window.location.replace('/auth/signin')
          }
        }
      } catch (error) {
        console.error('[ClientHome] Session check error:', error)
        // On error, redirect to signin if still on /
        if (!redirectAttemptedRef.current && window.location.pathname === '/') {
          redirectAttemptedRef.current = true
          sessionStorage.setItem(REDIRECT_KEY, 'true')
          window.location.replace('/auth/signin')
        }
      } finally {
        setChecking(false)
      }
    }
    
    checkSession()
  }, [])

  // Check redirect flag before rendering anything
  if (typeof window !== 'undefined') {
    const redirectAttempted = sessionStorage.getItem(REDIRECT_KEY)
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

  // Final redirect flag check
  if (typeof window !== 'undefined') {
    const redirectAttempted = sessionStorage.getItem(REDIRECT_KEY)
    if (redirectAttempted === 'true') {
      return null
    }
  }

  // If no session, show nothing (redirect should have happened)
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
  // CRITICAL: Check pathname at the top level too
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    return null
  }
  return <ClientHome />
}
