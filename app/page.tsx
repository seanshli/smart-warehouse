'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
function ClientHome() {
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    // CRITICAL: Only check session if we're actually on the home page
    // Don't check if we're navigating to signin or other routes
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      // If we're not on home page, don't check session (prevents redirect loop)
      if (currentPath !== '/' && currentPath !== '') {
        console.log('[ClientHome] Not on home page, skipping session check:', currentPath)
        setLoading(false)
        return
      }
    }
    
    // Check session on client side
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'include'
        })
        if (response.ok) {
          const sessionData = await response.json()
          console.log('[ClientHome] Session data:', {
            hasUser: !!sessionData.user,
            userId: sessionData.user?.id,
            email: sessionData.user?.email
          })
          setSession(sessionData)
        } else {
          console.error('[ClientHome] Session check failed:', response.status)
        }
      } catch (error) {
        console.error('[ClientHome] Session check error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkSession()
  }, [])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check authentication on client side
  // CRITICAL: Only show auth required if we're actually on home page
  // This prevents redirect loop when navigating to signin
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    if (currentPath !== '/' && currentPath !== '') {
      // Not on home page - don't render anything (let other pages render)
      return null
    }
  }

  if (!session || !session.user || !session.user.id) {
    const handleGoToLogin = () => {
      // Use window.location.href for Capacitor compatibility
      // This is more reliable than anchor tags in WebView
      if (typeof window !== 'undefined') {
        console.log('[ClientHome] Navigating to signin page')
        // Use replace to prevent back button issues
        window.location.replace('/auth/signin')
      }
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to access the dashboard.</p>
          <button
            onClick={handleGoToLogin}
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors text-center font-medium cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

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
