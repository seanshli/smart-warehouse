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

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Check cache first
    const cacheKey = CacheKeys.dashboardStats(household.id)
    const cachedData = cache.get(cacheKey)
    
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

    // Get dashboard statistics
    const [
      totalItems,
      totalRooms,
      lowStockItems,
      householdMembers,
      recentActivities
    ] = await Promise.all([
      // Total items count
      prisma.item.count({
        where: {
          householdId: household.id
        }
      }),
      
      // Total rooms count
      prisma.room.count({
        where: {
          householdId: household.id
        }
      }),
      
      // Low stock items count (quantity <= minQuantity)
      prisma.item.findMany({
        where: {
          householdId: household.id
        },
        select: {
          id: true,
          quantity: true,
          minQuantity: true
        }
      }).then(items => {
        return items.filter(item => item.minQuantity !== null && item.quantity <= item.minQuantity).length
      }),
      
      // Household members count
      prisma.householdMember.count({
        where: {
          householdId: household.id
        }
      }),
      
      // Recent activities (last 10)
      prisma.itemHistory.findMany({
        where: {
          item: {
            householdId: household.id
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
        include: {
          performer: {
            select: {
              name: true,
              email: true
            }
          },
          item: {
            include: {
              room: true,
              cabinet: true,
              category: true
            }
          }
        }
      })
    ])

    // Transform activities with translation
    const transformedActivities = await Promise.all(recentActivities.map(async (activity) => ({
      id: activity.id,
      action: activity.action,
      description: await translateItemContentEnhanced(activity.description || '', userLanguage),
      createdAt: activity.createdAt,
      performer: activity.performer,
      item: activity.item ? {
        id: activity.item.id,
        name: await translateItemContentEnhanced(activity.item.name, userLanguage),
        room: activity.item.room ? {
          id: activity.item.room.id,
          name: translateRoomName(activity.item.room.name, userLanguage)
        } : null,
        cabinet: activity.item.cabinet ? {
          id: activity.item.cabinet.id,
          name: translateCabinetName(activity.item.cabinet.name, userLanguage)
        } : null,
        category: activity.item.category ? {
          id: activity.item.category.id,
          name: translateCategoryName(activity.item.category.name, userLanguage)
        } : null
      } : null
    })))

    const result = {
      totalItems,
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
