import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/cache'
import { getNormalizedCategoryKey, getCategoryDisplayName } from '@/lib/category-translations'
import { getNormalizedRoomKey, getRoomDisplayName } from '@/lib/room-translations'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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

    // Parse query parameters for filtering
    const url = new URL(request.url)
    const householdId = url.searchParams.get('householdId')
    const userId = url.searchParams.get('userId')
    const categoryId = url.searchParams.get('categoryId')
    const roomId = url.searchParams.get('roomId')
    const timeRange = url.searchParams.get('timeRange') || '7d'

    // Get language from Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language') || 'en'
    const language = acceptLanguage.split(',')[0].split('-')[0] === 'zh' ? acceptLanguage : acceptLanguage.split(',')[0]

    // Calculate date range
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Build where clause for filtering
    const whereClause: any = {
      createdAt: {
        gte: since
      }
    }

    if (householdId && householdId !== 'all') {
      whereClause.item = {
        householdId: householdId
      }
    }

    if (userId && userId !== 'all') {
      whereClause.performedBy = userId
    }

    if (categoryId && categoryId !== 'all') {
      whereClause.item = {
        ...whereClause.item,
        categoryId: categoryId
      }
    }

    if (roomId && roomId !== 'all') {
      whereClause.item = {
        ...whereClause.item,
        roomId: roomId
      }
    }

    // Get basic counts
    const [users, households, items] = await Promise.all([
      prisma.user.count(),
      prisma.household.count(),
      prisma.item.count(),
    ])

    // Get activity events with filtering
    const events = await prisma.itemHistory.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        item: {
          include: {
            category: true,
            room: true
          }
        }
      }
    })

    // Process activity data
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

    // Get items by category with aggregation
    const itemsByCategory = await prisma.item.groupBy({
      by: ['categoryId'],
      _count: {
        id: true
      },
      where: householdId && householdId !== 'all' ? { householdId } : undefined
    })

    const categoryData: Record<string, number> = {}
    for (const item of itemsByCategory) {
      if (item.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: item.categoryId },
          select: { name: true }
        })
        const categoryName = category?.name || 'Unknown'
        const normalizedKey = getNormalizedCategoryKey(categoryName)
        const displayName = getCategoryDisplayName(normalizedKey, language)
        
        // Aggregate by normalized key (cross-language)
        if (categoryData[displayName]) {
          categoryData[displayName] += item._count.id
        } else {
          categoryData[displayName] = item._count.id
        }
      }
    }

    // Get items by room with aggregation
    const itemsByRoom = await prisma.item.groupBy({
      by: ['roomId'],
      _count: {
        id: true
      },
      where: householdId && householdId !== 'all' ? { householdId } : undefined
    })

    const roomData: Record<string, number> = {}
    for (const item of itemsByRoom) {
      if (item.roomId) {
        const room = await prisma.room.findUnique({
          where: { id: item.roomId },
          select: { name: true }
        })
        const roomName = room?.name || 'Unknown'
        const normalizedKey = getNormalizedRoomKey(roomName)
        const displayName = getRoomDisplayName(normalizedKey, language)
        
        // Aggregate by normalized key (cross-language)
        if (roomData[displayName]) {
          roomData[displayName] += item._count.id
        } else {
          roomData[displayName] = item._count.id
        }
      }
    }

    // Get users by household
    const usersByHousehold = await prisma.householdMember.groupBy({
      by: ['householdId'],
      _count: {
        userId: true
      }
    })

    const householdData: Record<string, number> = {}
    for (const member of usersByHousehold) {
      const household = await prisma.household.findUnique({
        where: { id: member.householdId },
        select: { name: true }
      })
      householdData[household?.name || 'Unknown'] = member._count.userId
    }

    // Get activity by user
    const activityByUser = await prisma.itemHistory.groupBy({
      by: ['performedBy'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: since
        }
      }
    })

    const userActivityData: Record<string, number> = {}
    for (const activity of activityByUser) {
      const user = await prisma.user.findUnique({
        where: { id: activity.performedBy },
        select: { name: true, email: true }
      })
      const userName = user?.name || user?.email || 'Unknown'
      userActivityData[userName] = activity._count.id
    }

    // Get MQTT statistics
    let mqttStats = null
    try {
      const { getMQTTConnectionStats, getMQTTClient } = await import('@/lib/mqtt-client')
      const connectionStats = getMQTTConnectionStats()
      const globalClient = getMQTTClient()
      const globalConnected = globalClient.isConnected()
      
      const activeConnections = connectionStats.filter(s => s.connected).length
      const totalHouseholds = connectionStats.filter(s => s.householdId !== null).length
      const activeHouseholds = connectionStats.filter(s => s.householdId !== null && s.connected).length
      
      mqttStats = {
        brokerUrl: process.env.MQTT_BROKER_URL || 'not configured',
        globalConnected,
        totalConnections: connectionStats.length,
        activeConnections,
        totalHouseholds,
        activeHouseholds,
      }
    } catch (mqttError) {
      console.warn('Failed to get MQTT stats:', mqttError)
      // Don't fail the request if MQTT stats fail
    }

    const result = { 
      users, 
      households, 
      items, 
      perDay, 
      perHour,
      itemsByCategory: categoryData,
      itemsByRoom: roomData,
      usersByHousehold: householdData,
      activityByUser: userActivityData,
      mqtt: mqttStats
    }
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


