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
// This works reliably in Capacitor WebView where middleware redirects may not
function ClientHome() {
  const [mounted, setMounted] = useState(false)
  const [checking, setChecking] = useState(true)

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
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'include'
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
            console.log('[ClientHome] No session, redirecting to signin')
            window.location.replace('/auth/signin')
            return
          }
          // Has session - allow render
          setChecking(false)
        } else {
          // Session check failed - redirect to signin
          console.log('[ClientHome] Session check failed, redirecting to signin')
          if (typeof window !== 'undefined') {
            window.location.replace('/auth/signin')
          }
        }
      } catch (error) {
        console.error('[ClientHome] Session check error:', error)
        // On error, redirect to signin
        if (typeof window !== 'undefined') {
          window.location.replace('/auth/signin')
        }
      }
    }
    
    checkAndRedirect()
  }, [])

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
