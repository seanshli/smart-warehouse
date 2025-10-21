import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No session' })
    }

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { credentials: true }
    })

    return NextResponse.json({
      session: {
        user: session.user,
        isAdmin: (session.user as any).isAdmin
      },
      database: {
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: (user as any).isAdmin,
          hasCredentials: !!user.credentials
        } : null
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Debug failed', details: error })
  }
}
