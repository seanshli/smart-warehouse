import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Simple in-memory rate limiting to prevent abuse
const requestCounts = new Map<string, { count: number; lastReset: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10

function isRateLimited(identifier: string): boolean {
  const now = Date.now()
  const userRequests = requestCounts.get(identifier)
  
  if (!userRequests || now - userRequests.lastReset > RATE_LIMIT_WINDOW) {
    requestCounts.set(identifier, { count: 1, lastReset: now })
    return false
  }
  
  if (userRequests.count >= MAX_REQUESTS_PER_WINDOW) {
    return true
  }
  
  userRequests.count++
  return false
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Rate limiting
    const identifier = (session?.user as any)?.id || 'anonymous'
    if (isRateLimited(identifier)) {
      console.log('Rate limited request from:', identifier)
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    
    // Temporary: Use demo user if no session for testing
    let userId = (session?.user as any)?.id
    if (!userId) {
      console.log('No session found, using demo user for testing')
      // Get demo user ID
      const demoUser = await prisma.user.findUnique({
        where: { email: 'demo@smartwarehouse.com' }
      })
      if (demoUser) {
        userId = demoUser.id
      } else {
        return NextResponse.json({ error: 'Unauthorized - no demo user found' }, { status: 401 })
      }
    }

    console.log('Grouped-direct API: User ID:', userId)

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

    console.log('Grouped-direct API: Household ID:', household.id)

    // Get items using Prisma with better error handling
    let items
    try {
      items = await prisma.item.findMany({
        where: {
          householdId: household.id
        },
        include: {
          category: true,
          room: true,
          cabinet: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
        { status: 503 }
      )
    }

    console.log('Grouped-direct API: Found', items.length, 'items')

    // Get user's language preference for translation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true }
    })
    const userLanguage = user?.language || 'en'

    // Simple item name and description translation function
    const translateItemContent = (content: string, targetLanguage: string): string => {
      if (targetLanguage !== 'en') return content
      
      // Common item name and description translations from Chinese to English
      const translations: Record<string, string> = {
        '日本製銀色天然礦泉水瓶 400ml': 'Japanese Silver Natural Mineral Water Bottle 400ml',
        'Panasonic 黑色多功能遙控器': 'Panasonic Black Multifunction Remote Control',
        'Beige Cotton T-Shirt': 'Beige Cotton T-Shirt', // Already in English
        '白色短袖T恤': 'White Short Sleeve T-Shirt',
        '這是一個銀色的天然礦泉水瓶,容量為400毫升,瓶身上印有綠色水滴圖案,標示為日本製造。': 'This is a silver natural mineral water bottle, with a capacity of 400ml, with a green water drop pattern printed on the bottle, marked as made in Japan.',
        '這是一款黑色的Panasonic遙控器,具有多個流媒體按鈕如Netflix、Hulu、YouTube等,適用於控制多種設備。': 'This is a black Panasonic remote control, with multiple streaming media buttons such as Netflix, Hulu, YouTube, etc., suitable for controlling multiple devices.',
        'A plain beige t-shirt made of cotton, featuring a crew neck and short sleeves.': 'A plain beige t-shirt made of cotton, featuring a crew neck and short sleeves.', // Already in English
        '這是一件白色的短袖T恤,上面印有 \'THE COME MUSIC\' 字樣,並有紅色、藍色和黑色的條紋設計。': 'This is a white short-sleeved T-shirt, with \'THE COME MUSIC\' printed on it, and red, blue, and black stripe designs.'
      }
      
      return translations[content] || content
    }

    // Transform the results to match expected format
    const transformedItems = items.map(item => ({
      id: item.id,
      name: translateItemContent(item.name, userLanguage),
      description: translateItemContent(item.description || '', userLanguage),
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      barcode: item.barcode,
      imageUrl: item.imageUrl,
      householdId: item.householdId,
      categoryId: item.categoryId,
      roomId: item.roomId,
      cabinetId: item.cabinetId,
      category: item.category ? { id: item.category.id, name: item.category.name } : null,
      room: item.room ? { id: item.room.id, name: item.room.name } : null,
      cabinet: item.cabinet ? { id: item.cabinet.id, name: item.cabinet.name } : null,
      itemIds: [item.id] // Track all item IDs for this group
    }))

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error('Error fetching grouped items (direct):', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to fetch grouped items',
        details: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    )
  }
}
