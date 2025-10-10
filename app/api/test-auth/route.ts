import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing authentication...')
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
    console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? 'exists' : 'null')
    console.log('User ID:', (session?.user as any)?.id)
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'No session found',
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: (session.user as any).id,
        email: session.user.email,
        name: session.user.name
      },
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL
    })

  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json(
      { 
        error: 'Authentication test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
