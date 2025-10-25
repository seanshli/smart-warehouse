import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        householdMemberships: {
          include: {
            household: true
          }
        }
      }
    })

    if (!user || !user.householdMemberships.length) {
      return NextResponse.json({ hasChanges: false })
    }

    const householdId = user.householdMemberships[0].household.id

    // Check for recent changes in the household (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const recentChanges = await prisma.itemHistory.count({
      where: {
        item: {
          householdId: householdId
        },
        createdAt: {
          gte: fiveMinutesAgo
        }
      }
    })

    return NextResponse.json({ 
      hasChanges: recentChanges > 0,
      changeCount: recentChanges
    })
  } catch (error) {
    console.error('Error checking for household changes:', error)
    return NextResponse.json({ hasChanges: false })
  }
}