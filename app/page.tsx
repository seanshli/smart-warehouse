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
    
    // IMMEDIATE redirect if no session - don't wait for API call
    // This is critical for Capacitor apps to prevent redirect loops
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      // Only redirect from home page
      if (currentPath === '/' || currentPath === '') {
        // Check session, but redirect immediately if no session
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
              
              // Only set session if we have a valid user
              if (sessionData.user && sessionData.user.id) {
                setSession(sessionData)
              } else {
                // No valid session - redirect immediately
                console.log('[ClientHome] No valid session, redirecting to signin')
                window.location.replace('/auth/signin')
              }
            } else {
              console.error('[ClientHome] Session check failed:', response.status)
              // Session check failed - redirect immediately
              window.location.replace('/auth/signin')
            }
          } catch (error) {
            console.error('[ClientHome] Session check error:', error)
            // Error checking session - redirect immediately
            window.location.replace('/auth/signin')
          } finally {
            setLoading(false)
          }
        }
        
        checkSession()
      } else {
        // Not on home page, just check session normally
        const checkSession = async () => {
          try {
            const response = await fetch('/api/auth/session', {
              cache: 'no-store',
              credentials: 'include'
            })
            if (response.ok) {
              const sessionData = await response.json()
              setSession(sessionData)
            }
          } catch (error) {
            console.error('[ClientHome] Session check error:', error)
          } finally {
            setLoading(false)
          }
        }
        checkSession()
      }
    }
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


