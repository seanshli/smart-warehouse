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

// Client-side only component to prevent hydration issues
// Check authentication immediately and redirect if needed
// Optimized for Capacitor WebView where redirects need special handling
function ClientHome() {
  const [mounted, setMounted] = useState(false)
  const [checking, setChecking] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // CRITICAL: Check pathname first - only run if we're on home page
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      if (currentPath !== '/' && currentPath !== '') {
        // Not on home page - don't check, let other pages handle themselves
        setChecking(false)
        return
      }
    }

    // Check session immediately - redirect if no session
    const checkAndRedirect = async () => {
      // Prevent multiple redirect attempts
      if (redirecting) {
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
          // Double-check we're still on home page
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            setChecking(false)
            return
          }
          
          if (!sessionData.user || !sessionData.user.id) {
            // No session - redirect to signin immediately
            // Use a flag to prevent multiple redirects
            if (!redirecting && typeof window !== 'undefined') {
              setRedirecting(true)
              console.log('[ClientHome] No session, redirecting to signin')
              // Use href instead of replace for better Capacitor compatibility
              // Add small delay to ensure state is set
              setTimeout(() => {
                window.location.href = '/auth/signin'
              }, 100)
            }
            return
          }
          // Has session - allow render
          setChecking(false)
        } else {
          // Session check failed - redirect to signin
          if (!redirecting && typeof window !== 'undefined') {
            setRedirecting(true)
            console.log('[ClientHome] Session check failed, redirecting to signin')
            setTimeout(() => {
              window.location.href = '/auth/signin'
            }, 100)
          }
        }
      } catch (error) {
        console.error('[ClientHome] Session check error:', error)
        // On error, redirect to signin
        if (!redirecting && typeof window !== 'undefined') {
          setRedirecting(true)
          setTimeout(() => {
            window.location.href = '/auth/signin'
          }, 100)
        }
      }
    }
    
    // Small delay to ensure component is fully mounted
    setTimeout(() => {
      checkAndRedirect()
    }, 50)
  }, [redirecting])

  // If redirecting, show nothing (redirect is in progress)
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // If redirecting, show redirect message
  if (redirecting) {
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

  // Check pathname one more time before rendering
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
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
