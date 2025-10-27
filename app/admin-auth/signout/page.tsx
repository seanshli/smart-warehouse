'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'

export default function AdminSignOut() {
  useEffect(() => {
    const handleSignOut = async () => {
      try {
        console.log('[Admin] Signing out from admin...')
        
        // Clear all browser storage first
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
        
        // Sign out with NextAuth and redirect to admin signin
        await signOut({ 
          callbackUrl: '/admin-auth/signin',
          redirect: true 
        })
      } catch (error) {
        console.error('[Admin] Sign out error:', error)
        // Force redirect even if there's an error
        if (typeof window !== 'undefined') {
          window.location.href = '/admin-auth/signin'
        }
      }
    }

    handleSignOut()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing out...</p>
      </div>
    </div>
  )
}
