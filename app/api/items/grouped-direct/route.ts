import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { translateItemContent } from '@/lib/item-translations'

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

    // Use centralized translation function (already imported)

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
