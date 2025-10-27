import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Dashboard API called')
    
    // Get session
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? 'Found' : 'Not found')
    
    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'No session found',
        step: 'session_check',
        details: 'User not authenticated'
      })
    }

    const userEmail = session.user.email
    console.log('User email:', userEmail)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        householdMemberships: {
          include: {
            household: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found in database',
        step: 'user_check',
        userEmail,
        details: 'User exists in session but not in database'
      })
    }

    console.log('User found:', user.id)
    console.log('Household memberships:', user.householdMemberships.length)

    // Check household memberships
    if (user.householdMemberships.length === 0) {
      return NextResponse.json({
        error: 'No household memberships found',
        step: 'household_check',
        userEmail,
        userId: user.id,
        details: 'User has no households assigned',
        solution: 'Will create default household automatically'
      })
    }

    // Get first household
    const household = user.householdMemberships[0].household
    console.log('Using household:', household.id)

    // Try to fetch items
    const items = await prisma.item.findMany({
      where: {
        householdId: household.id
      },
      include: {
        room: true,
        category: true
      }
    })

    console.log('Items found:', items.length)

    return NextResponse.json({
      success: true,
      step: 'complete',
      userEmail,
      userId: user.id,
      household: {
        id: household.id,
        name: household.name
      },
      itemsCount: items.length,
      items: items.slice(0, 3), // Show first 3 items
      details: 'Dashboard should work properly'
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      step: 'error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
