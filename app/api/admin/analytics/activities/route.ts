import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Admin analytics endpoint for user activities
 * Provides statistics on searches, views, filters, and navigation
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const url = new URL(request.url)
    const householdId = url.searchParams.get('householdId')
    const userId = url.searchParams.get('userId')
    const activityType = url.searchParams.get('activityType')
    const timeRange = url.searchParams.get('timeRange') || '7d'

    // Calculate date range
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: since
      }
    }

    if (householdId && householdId !== 'all') {
      whereClause.householdId = householdId
    }

    if (userId && userId !== 'all') {
      whereClause.userId = userId
    }

    if (activityType && activityType !== 'all') {
      whereClause.activityType = activityType
    }

    // Get all activities
    const activities = await (prisma as any).userActivity.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        household: {
          select: {
            id: true,
            name: true
          }
        },
        item: {
          select: {
            id: true,
            name: true
          }
        },
        room: {
          select: {
            id: true,
            name: true
          }
        },
        cabinet: {
          select: {
            id: true,
            name: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000 // Limit for performance
    })

    // Aggregate statistics
    const stats = {
      total: activities.length,
      byActivityType: {} as Record<string, number>,
      byAction: {} as Record<string, number>,
      byHousehold: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      byDay: {} as Record<string, number>,
      byHour: {} as Record<string, number>,
      topSearches: [] as Array<{ query: string; count: number }>,
      topItems: {} as Record<string, number>,
      topLocations: {} as Record<string, number>,
      topCategories: {} as Record<string, number>
    }

    // Process activities
    const searchQueries: Record<string, number> = {}
    
    for (const activity of activities) {
      // Count by activity type
      stats.byActivityType[activity.activityType] = (stats.byActivityType[activity.activityType] || 0) + 1
      
      // Count by action
      stats.byAction[activity.action] = (stats.byAction[activity.action] || 0) + 1
      
      // Count by household
      const householdName = activity.household?.name || 'Unknown'
      stats.byHousehold[householdName] = (stats.byHousehold[householdName] || 0) + 1
      
      // Count by user
      const userName = activity.user?.name || activity.user?.email || 'Unknown'
      stats.byUser[userName] = (stats.byUser[userName] || 0) + 1
      
      // Count by day
      if (activity.createdAt) {
        const dayKey = new Date(activity.createdAt).toISOString().slice(0, 10)
        stats.byDay[dayKey] = (stats.byDay[dayKey] || 0) + 1
        
        // Count by hour
        const hourKey = new Date(activity.createdAt).toISOString().slice(0, 13)
        stats.byHour[hourKey] = (stats.byHour[hourKey] || 0) + 1
      }
      
      // Track searches
      if (activity.activityType === 'search' && activity.metadata) {
        const metadata = activity.metadata as any
        if (metadata.query) {
          const query = metadata.query.toLowerCase().trim()
          searchQueries[query] = (searchQueries[query] || 0) + 1
        }
      }
      
      // Track item views
      if (activity.item) {
        const itemName = activity.item.name
        stats.topItems[itemName] = (stats.topItems[itemName] || 0) + 1
      }
      
      // Track location views
      if (activity.room) {
        const locationKey = activity.cabinet 
          ? `${activity.room.name} → ${activity.cabinet.name}`
          : activity.room.name
        stats.topLocations[locationKey] = (stats.topLocations[locationKey] || 0) + 1
      }
      
      // Track category views
      if (activity.category) {
        stats.topCategories[activity.category.name] = (stats.topCategories[activity.category.name] || 0) + 1
      }
    }

    // Get top searches
    stats.topSearches = Object.entries(searchQueries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }))

    // Get top items (limit to top 20)
    const topItemsArray = Object.entries(stats.topItems)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
    stats.topItems = Object.fromEntries(topItemsArray)

    // Get top locations (limit to top 20)
    const topLocationsArray = Object.entries(stats.topLocations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
    stats.topLocations = Object.fromEntries(topLocationsArray)

    // Get top categories (limit to top 20)
    const topCategoriesArray = Object.entries(stats.topCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
    stats.topCategories = Object.fromEntries(topCategoriesArray)

    return NextResponse.json({
      activities: activities.slice(0, 100), // Return recent activities
      stats
    })
  } catch (error) {
    console.error('Error fetching activity analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

