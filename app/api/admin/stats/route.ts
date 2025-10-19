import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const [users, households, items] = await Promise.all([
      prisma.user.count(),
      prisma.household.count(),
      prisma.item.count(),
    ])

    // Simple per-day/hour counts for last 7 days using createdAt
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const events = await prisma.itemHistory.findMany({
      where: {
        createdAt: {
          gte: since
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const perDay: Record<string, number> = {}
    const perHour: Record<string, number> = {}
    for (const e of events) {
      if (e.createdAt) {
        const d = new Date(e.createdAt)
        const dayKey = d.toISOString().slice(0, 10)
        const hourKey = d.toISOString().slice(0, 13)
        perDay[dayKey] = (perDay[dayKey] || 0) + 1
        perHour[hourKey] = (perHour[hourKey] || 0) + 1
      }
    }

    return NextResponse.json({ users, households, items, perDay, perHour })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


