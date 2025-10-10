import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Session data:', session)
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'No session found',
        session: null
      }, { status: 401 })
    }

    const userId = (session.user as any)?.id
    console.log('User ID from session:', userId)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    console.log('User from database:', user)

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        members: true
      }
    })

    console.log('Household found:', household)

    return NextResponse.json({
      session: {
        user: session.user,
        userId: userId
      },
      user: user,
      household: household,
      debug: {
        hasSession: !!session,
        hasUser: !!user,
        hasHousehold: !!household,
        householdId: household?.id,
        householdName: household?.name,
        memberCount: household?.members?.length || 0
      }
    })
  } catch (error) {
    console.error('Debug session error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Debug failed: ' + errorMessage },
      { status: 500 }
    )
  }
}
