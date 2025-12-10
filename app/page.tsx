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
          // If session check fails, redirect to signin immediately
          if (typeof window !== 'undefined' && window.location.pathname === '/') {
            window.location.replace('/auth/signin')
          }
        }
      } catch (error) {
        console.error('[ClientHome] Session check error:', error)
        // If error, redirect to signin immediately
        if (typeof window !== 'undefined' && window.location.pathname === '/') {
          window.location.replace('/auth/signin')
        }
      } finally {
        setLoading(false)
      }
    }
    
    checkSession()
  }, [])

  // Redirect to signin immediately if no session (for Capacitor apps)
  useEffect(() => {
    if (mounted && !loading && (!session || !session.user || !session.user.id)) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        // Only redirect if we're on the home page, not already on signin
        if (currentPath === '/' || currentPath === '') {
          console.log('[ClientHome] No session detected, redirecting to signin immediately')
          window.location.replace('/auth/signin')
        }
      }
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
    // Show loading while redirect happens
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting to login...</p>
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


