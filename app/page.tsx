import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'

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

export default async function Home() {
  // Server-side session check - redirect immediately if no session
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !(session.user as any).id) {
    // Server-side redirect - happens before any client code runs
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen">
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </div>
  )
}
