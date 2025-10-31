import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { translateRoomName, translateCabinetName, translateCategoryName, translateItemContentEnhanced } from '@/lib/location-translations'
import { cache, CacheKeys } from '@/lib/cache'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const { searchParams } = new URL(request.url)
    const activeHouseholdId = searchParams.get('householdId')

    let household
    if (activeHouseholdId) {
      // Use the specified household ID
      household = await prisma.household.findFirst({
        where: {
          id: activeHouseholdId,
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    } else {
      // Fallback to first household
      household = await prisma.household.findFirst({
        where: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    }

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Check cache first (but bypass if switching households)
    const cacheKey = CacheKeys.dashboardStats(household.id)
    const bypassCache = searchParams.get('bypassCache') === 'true'
    const cachedData = !bypassCache ? cache.get(cacheKey) : null
    
    if (cachedData) {
      console.log('Dashboard Stats API: Returning cached data for household:', household.id)
      return NextResponse.json(cachedData)
    }

    // Get user's language preference for translation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true }
    })
    const userLanguage = user?.language || 'en'

    // Get dashboard statistics with optimized queries
    console.log('📊 Dashboard Stats: Starting database queries for household:', household.id)
    const startTime = Date.now()
    
    // Use raw SQL for better performance on counts
    const [
      totalItems,
      totalRooms,
      householdMembers,
      itemsWithQuantities,
      recentActivities
    ] = await Promise.all([
      // Total items quantity across household (sum of quantities)
      prisma.item.aggregate({
        where: {
          householdId: household.id
        },
        _sum: { quantity: true }
      }),
      
      // Total rooms count - optimized
      prisma.room.count({
        where: {
          householdId: household.id
        }
      }),
      
      // Household members count - optimized
      prisma.householdMember.count({
        where: {
          householdId: household.id
        }
      }),
      
      // Get items with quantities for low stock calculation - simplified
      prisma.item.findMany({
        where: {
          householdId: household.id,
          minQuantity: {
            not: null
          }
        },
        select: {
          quantity: true,
          minQuantity: true
        }
      }),
      
      // Recent activities - simplified (no complex includes)
      prisma.itemHistory.findMany({
        where: {
          item: {
            householdId: household.id
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5, // Reduced from 10 to 5 for better performance
        select: {
          id: true,
          action: true,
          description: true,
          createdAt: true,
          performer: {
            select: {
              name: true
            }
          }
        }
      })
    ])
    
    // Calculate low stock items count
    const lowStockItems = itemsWithQuantities.filter(item => 
      item.minQuantity !== null && item.quantity <= item.minQuantity
    ).length
    
    const queryTime = Date.now() - startTime
    console.log('📊 Dashboard Stats: Database queries completed in', queryTime, 'ms')

    // Transform activities - simplified (no complex translation for now)
    const transformedActivities = recentActivities.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: activity.description || '',
      createdAt: activity.createdAt,
      performer: activity.performer
    }))

    const totalItemsQuantity = (totalItems as any)?._sum?.quantity || 0
    const result = {
      totalItems: Number(totalItemsQuantity),
      totalRooms,
      lowStockItems,
      householdMembers,
      recentActivities: transformedActivities,
      debug: {
        lowStockCalculation: lowStockItems,
        householdId: household.id,
        userId: userId,
        userLanguage: userLanguage
      }
    }

    // Cache the result for 5 minutes (dashboard stats change less frequently)
    cache.set(cacheKey, result, 5 * 60 * 1000)
    console.log('Dashboard Stats API: Cached data for household:', household.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics',
        details: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    )
  }
}
