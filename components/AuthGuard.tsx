'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') {
      // Still loading, wait
      return
    }

    if (requireAuth && !session) {
      // Not authenticated, redirect to login
      console.log('[AuthGuard] No session, redirecting to login')
      router.push('/auth/signin')
      return
    }

    if (requireAuth && session && !session.user) {
      // Invalid session, redirect to login
      console.log('[AuthGuard] Invalid session, redirecting to login')
      router.push('/auth/signin')
      return
    }

    if (requireAuth && session && session.user && !(session.user as any).id) {
      // Session missing required fields, redirect to login
      console.log('[AuthGuard] Session missing required fields, redirecting to login')
      router.push('/auth/signin')
      return
    }
  }, [session, status, requireAuth, router])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but not present, don't render children
  if (requireAuth && !session) {
    return null
  }

  // If authentication is required but session is invalid, don't render children
  if (requireAuth && session && (!session.user || !(session.user as any).id)) {
    return null
  }

  return <>{children}</>
}
