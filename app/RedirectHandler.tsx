'use client'

import { useEffect, useRef } from 'react'

// This component handles redirects ONLY for the home page
// CRITICAL: Must NEVER run on /auth/signin or any other route
const REDIRECT_KEY = 'smart-warehouse-redirect-attempted'

export default function RedirectHandler() {
  const hasRunRef = useRef(false)
  const redirectAttemptedRef = useRef(false)

  useEffect(() => {
    // CRITICAL: Only run once per mount
    if (hasRunRef.current) {
      return
    }

    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      
      // CRITICAL: ONLY run on home page - return immediately on any other route
      // This includes /auth/signin, /auth/signup, etc.
      if (currentPath !== '/') {
        hasRunRef.current = true // Mark as run so it doesn't check again
        return // CRITICAL: Don't run on any other route
      }

      // Check if redirect was already attempted (prevent loops)
      const redirectAttempted = sessionStorage.getItem(REDIRECT_KEY)
      if (redirectAttempted === 'true') {
        hasRunRef.current = true
        return // Already attempted redirect, don't run again
      }

      hasRunRef.current = true
      
      // Small delay to ensure we're definitely on / and not transitioning
      setTimeout(() => {
        // Final check - are we still on /?
        if (window.location.pathname !== '/') {
          return // Not on home page anymore, abort
        }

        // Check session immediately
        fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'include'
        })
        .then(res => res.json())
        .then(sessionData => {
          // CRITICAL: Final check - are we still on home page?
          if (window.location.pathname !== '/') {
            return // Not on home page anymore, abort
          }

          // CRITICAL: Check if redirect was attempted while fetching
          const redirectAttempted = sessionStorage.getItem(REDIRECT_KEY)
          if (redirectAttempted === 'true') {
            return // Redirect already attempted
          }

          if (!sessionData.user || !sessionData.user.id) {
            // No session - set flag BEFORE redirect
            if (!redirectAttemptedRef.current) {
              redirectAttemptedRef.current = true
              sessionStorage.setItem(REDIRECT_KEY, 'true')
              console.log('[RedirectHandler] No session on /, redirecting to signin')
              // Use replace to prevent back button issues
              window.location.replace('/auth/signin')
            }
          } else {
            // Has session - clear redirect flag
            sessionStorage.removeItem(REDIRECT_KEY)
          }
        })
        .catch(() => {
          // On error, only redirect if still on / and not already attempted
          if (window.location.pathname === '/' && !redirectAttemptedRef.current) {
            redirectAttemptedRef.current = true
            sessionStorage.setItem(REDIRECT_KEY, 'true')
            window.location.replace('/auth/signin')
          }
        })
      }, 100) // Small delay to ensure route is stable
    }
  }, [])
  
  return null
}
