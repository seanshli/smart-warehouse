import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      user: session?.user || null,
      isAdmin: (session?.user as any)?.isAdmin || false,
      headers: {
        cookie: request.headers.get('cookie') || 'no cookie',
        'user-agent': request.headers.get('user-agent') || 'no user-agent',
      }
    })
  } catch (error) {
    console.error('Test mobile auth error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
