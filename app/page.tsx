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
// Middleware handles redirect to /auth/signin if not authenticated
// So this component only renders if user is authenticated
function ClientHome() {
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    // Verify session - if middleware let us through, we should have a session
    // But double-check on client side and redirect immediately if missing
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'include'
        })
        if (response.ok) {
          const sessionData = await response.json()
          if (sessionData.user && sessionData.user.id) {
            console.log('[ClientHome] Session verified:', {
              userId: sessionData.user.id,
              email: sessionData.user.email
            })
            setSession(sessionData)
          } else {
            // No valid session - redirect immediately to signin
            console.log('[ClientHome] No valid session, redirecting to signin')
            if (typeof window !== 'undefined') {
              window.location.replace('/auth/signin')
            }
            return
          }
        } else {
          // Session check failed - redirect immediately
          console.log('[ClientHome] Session check failed, redirecting to signin')
          if (typeof window !== 'undefined') {
            window.location.replace('/auth/signin')
          }
          return
        }
      } catch (error) {
        console.error('[ClientHome] Session check error:', error)
        // On error, redirect to signin
        if (typeof window !== 'undefined') {
          window.location.replace('/auth/signin')
        }
        return
      } finally {
        setLoading(false)
      }
    }
    
    checkSession()
  }, [])

  // Show loading while checking session
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

  // If no session after check, show nothing (redirect should have happened)
  if (!session || !session.user || !session.user.id) {
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
