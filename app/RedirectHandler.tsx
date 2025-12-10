'use client'

import { useEffect } from 'react'

// This component handles redirects for the home page in Capacitor
// It runs in the layout, so it's always active
// It checks if we're on / with no session and redirects immediately
export default function RedirectHandler() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      
      // Only handle redirects for the home page
      if (currentPath === '/') {
        // Check session immediately
        fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'include'
        })
        .then(res => res.json())
        .then(sessionData => {
          // Double-check we're still on home page
          if (window.location.pathname === '/') {
            if (!sessionData.user || !sessionData.user.id) {
              // No session - redirect immediately
              console.log('[RedirectHandler] No session on /, redirecting to signin')
              window.location.replace('/auth/signin')
            }
          }
        })
        .catch(() => {
          // On error, redirect to signin if still on /
          if (window.location.pathname === '/') {
            window.location.replace('/auth/signin')
          }
        })
      }
    }
  }, [])
  
  return null
}
