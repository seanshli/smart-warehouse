import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import Dashboard with no SSR to avoid hydration issues
const Dashboard = dynamic(() => import('@/components/Dashboard'), {
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

// Client-side cache clearing component
function CacheClearer() {
  if (typeof window !== 'undefined') {
    try {
      // Clear all caches on page load
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName)
          })
        }).catch(error => {
          console.warn('Cache clearing failed:', error)
        })
      }
      
      // Clear localStorage and sessionStorage
      localStorage.clear()
      sessionStorage.clear()
    } catch (error) {
      console.warn('Storage clearing failed:', error)
    }
  }
  return null
}

export default async function Home() {
  try {
    const session = await getServerSession(authOptions)

    console.log('[Home] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasId: !!(session?.user as any)?.id,
      email: session?.user?.email
    })

    // Always redirect to sign-in if not authenticated
    if (!session || !session.user || !(session.user as any).id) {
      console.log('[Home] No valid session, redirecting to login')
      redirect('/auth/signin')
    }

    console.log('[Home] Valid session for user:', session.user.email)
    
    return (
      <div className="min-h-screen">
        <CacheClearer />
        <Dashboard />
      </div>
    )
  } catch (error) {
    console.error('[Home] Error in Home component:', error)
    // If there's any error, redirect to signin to clear any corrupted state
    redirect('/auth/signin')
  }
}


