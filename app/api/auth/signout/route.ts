import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Not signed in' }, { status: 200 })
    }

    // Clear any server-side session data
    // For JWT sessions, the session will be invalidated client-side
    
    return NextResponse.json({ 
      message: 'Signed out successfully',
      redirectTo: '/auth/signin'
    }, { status: 200 })
  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    )
  }
}
