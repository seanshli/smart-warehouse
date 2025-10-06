'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignOut() {
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        // Clear any local storage
        localStorage.clear()
        sessionStorage.clear()
        
        // Sign out with NextAuth
        await signOut({ 
          callbackUrl: '/auth/signin',
          redirect: false 
        })
        
        // Force redirect to sign in page
        router.push('/auth/signin')
      } catch (error) {
        console.error('Sign out error:', error)
        // Force redirect even if there's an error
        router.push('/auth/signin')
      }
    }

    handleSignOut()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing out...</p>
      </div>
    </div>
  )
}
