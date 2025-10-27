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

export default async function Home() {
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
  
  // Wrap Dashboard in error boundary to prevent client-side errors
  try {
    return <Dashboard />
  } catch (error) {
    console.error('[Home] Dashboard error:', error)
    redirect('/auth/signin')
  }
}


