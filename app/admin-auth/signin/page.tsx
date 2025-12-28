'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

export default function AdminSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionCleared, setSessionCleared] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Clear any existing sessions on page load (only once)
    const clearExistingSession = async () => {
      try {
        console.log('[Admin] Clearing existing sessions...')
        
        // Force sign out any existing session first
        await signOut({ redirect: false })
        
        // Clear all browser storage
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
          
          // Clear any cached data
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            )
          }
          
          // Clear cookies more aggressively
          document.cookie.split(";").forEach(function(c) { 
            const cookie = c.replace(/^ +/, "").split("=")[0]
            document.cookie = `${cookie}=;expires=${new Date(0).toUTCString()};path=/`
            document.cookie = `${cookie}=;expires=${new Date(0).toUTCString()};path=/;domain=${window.location.hostname}`
            document.cookie = `${cookie}=;expires=${new Date(0).toUTCString()};path=/;domain=.${window.location.hostname}`
          });
          
          // Clear NextAuth specific cookies
          const nextAuthCookies = [
            'next-auth.session-token',
            '__Secure-next-auth.session-token',
            'next-auth.csrf-token',
            '__Host-next-auth.csrf-token'
          ]
          
          nextAuthCookies.forEach(cookieName => {
            document.cookie = `${cookieName}=;expires=${new Date(0).toUTCString()};path=/`
            document.cookie = `${cookieName}=;expires=${new Date(0).toUTCString()};path=/;domain=${window.location.hostname}`
            document.cookie = `${cookieName}=;expires=${new Date(0).toUTCString()};path=/;domain=.${window.location.hostname}`
          })
        }
        
        console.log('[Admin] Session clearing completed')
        setSessionCleared(true)
      } catch (error) {
        console.log('[Admin] Session clearing completed with errors:', error)
        setSessionCleared(true)
      }
    }
    
    // Only clear sessions on initial mount, don't auto-redirect
    clearExistingSession()
  }, []) // Empty dependency array - only run once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Check if user exists but doesn't have credentials
        try {
          const checkResponse = await fetch(`/api/admin/setup-user-credentials?email=${encodeURIComponent(email)}`)
          if (checkResponse.ok) {
            const checkData = await checkResponse.json()
            if (!checkData.user?.hasCredentials) {
              setError('User exists but credentials not set up. Please contact administrator to set up password.')
              return
            }
          }
        } catch (err) {
          // Ignore check errors
        }
        setError('Invalid credentials')
        return
      }

      // Check if user has admin privileges (super admin, community admin, building admin, or supplier admin)
      const session = await getSession()
      
      if (!session?.user) {
        setError('Session not found. Please try again.')
        return
      }

      // Check admin context to verify user has any admin privileges
      const contextResponse = await fetch('/api/admin/context')
      if (!contextResponse.ok) {
        setError('Failed to verify admin privileges.')
        return
      }

      const adminContext = await contextResponse.json()
      
      // Allow if user is super admin, community admin, building admin, or supplier admin
      const hasAdminAccess = 
        (session?.user as any)?.isAdmin || 
        adminContext?.isSuperAdmin ||
        (adminContext?.communityAdmins && adminContext.communityAdmins.length > 0) ||
        (adminContext?.buildingAdmins && adminContext.buildingAdmins.length > 0) ||
        (adminContext?.supplierAdmins && adminContext.supplierAdmins.length > 0)

      if (!hasAdminAccess) {
        setError('Access denied. Admin privileges required.')
        return
      }

      // Redirect to admin dashboard
      router.push('/admin')
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while session is being cleared
  if (!sessionCleared) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Clearing existing sessions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
            <ShieldCheckIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Sign In
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Smart Warehouse Administration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Admin Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In to Admin Panel'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Need help?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="font-medium text-red-600 hover:text-red-500"
              >
                ← Back to Main App
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Admin Access Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Only users with admin privileges can access this panel. Contact your system administrator if you need access.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
