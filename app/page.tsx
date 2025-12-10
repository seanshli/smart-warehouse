'use client'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
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

// Removed aggressive cache clearing that was causing session loops

// Client-side only component to prevent hydration issues
function ClientHome() {
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    
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

  // Auto-redirect to signin if no session (fallback for Capacitor apps)
  useEffect(() => {
    if (mounted && !loading && (!session || !session.user || !session.user.id)) {
      // Small delay to ensure UI renders, then redirect
      const redirectTimer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin'
        }
      }, 1000) // 1 second delay to show the message

      return () => clearTimeout(redirectTimer)
    }
  }, [mounted, loading, session])

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
  if (!session || !session.user || !session.user.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to access the dashboard.</p>
          <a
            href="/auth/signin"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-center cursor-pointer"
          >
            Go to Login
          </a>
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


