import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { translateItemContent } from '@/lib/item-translations'
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
      console.log('No household found for user:', userId)
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    console.log('Grouped-direct-cached API: Household ID:', household.id)

    // Check cache first
    const cacheKey = CacheKeys.groupedItems(household.id)
    const cachedData = cache.get(cacheKey)
    
    if (cachedData) {
      console.log('Grouped-direct-cached API: Returning cached data for household:', household.id)
      return NextResponse.json(cachedData)
    }

    // Simplified query - only get essential data
    const items = await prisma.item.findMany({
      where: {
        householdId: household.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        quantity: true,
        minQuantity: true,
        imageUrl: true,
        category: {
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
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('Grouped-direct-cached API: Found', items.length, 'items')

    // Get user's language preference for translation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true }
    })
    const userLanguage = user?.language || 'en'

    // Transform the results with comprehensive translation
    const transformedItems = await Promise.all(items.map(async item => ({
      id: item.id,
      name: await translateItemContentEnhanced(item.name, userLanguage),
      description: await translateItemContentEnhanced(item.description || '', userLanguage),
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      imageUrl: item.imageUrl,
      householdId: household.id,
      categoryId: item.category?.id,
      roomId: item.room?.id,
      cabinetId: item.cabinet?.id,
      category: item.category ? { 
        id: item.category.id, 
        name: translateCategoryName(item.category.name, userLanguage) 
      } : null,
      room: item.room ? { 
        id: item.room.id, 
        name: translateRoomName(item.room.name, userLanguage) 
      } : null,
      cabinet: item.cabinet ? { 
        id: item.cabinet.id, 
        name: translateCabinetName(item.cabinet.name, userLanguage) 
      } : null,
      itemIds: [item.id]
    })))

    // Cache the result for 5 minutes
    cache.set(cacheKey, transformedItems, 5 * 60 * 1000)
    console.log('Grouped-direct-cached API: Cached data for household:', household.id)

    // Set cache headers for browser/CDN caching
    const response = NextResponse.json(transformedItems)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response

  } catch (error) {
    console.error('Error fetching grouped items (cached):', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to fetch grouped items',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
