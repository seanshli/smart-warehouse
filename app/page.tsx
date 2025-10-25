import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const session = await getServerSession(authOptions)

  // Always redirect to sign-in for first-time users
  if (!session || !session.user || !(session.user as any).id) {
    console.log('[Home] No valid session, redirecting to login')
    redirect('/auth/signin')
  }

  console.log('[Home] Valid session for user:', session.user.email)
  return <Dashboard />
}


