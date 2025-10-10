import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma-safe'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const room = searchParams.get('room')

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

    // Build where clause for filtering
    const whereClause: any = {
      householdId: household.id
    }

    if (search) {
      whereClause.OR = [
        { barcode: { contains: search } },
        { qrCode: { contains: search } }
      ]
    }

    if (category) {
      whereClause.categoryId = category
    }

    if (room) {
      whereClause.roomId = room
    }

    // Get all items with their relations
    const items = await prisma.item.findMany({
      where: whereClause,
      include: {
        category: {
          include: {
            parent: true
          }
        },
        room: true,
        cabinet: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Group items by name, category, and location
    const groupedItems = new Map<string, any>()

    items.forEach(item => {
      // Create a unique key for grouping
      const groupKey = `${item.name.toLowerCase()}_${item.categoryId || 'no-category'}_${item.roomId || 'no-room'}_${item.cabinetId || 'no-cabinet'}`
      
      if (groupedItems.has(groupKey)) {
        const existingItem = groupedItems.get(groupKey)
        existingItem.quantity += item.quantity
        existingItem.itemIds.push(item.id)
        
        // Update min quantity to be the minimum of all grouped items
        existingItem.minQuantity = Math.min(existingItem.minQuantity, item.minQuantity)
        
        // Keep the most recent image URL if available
        if (item.imageUrl && !existingItem.imageUrl) {
          existingItem.imageUrl = item.imageUrl
        }
        
        // Merge descriptions (keep unique descriptions)
        if (item.description && !existingItem.description) {
          existingItem.description = item.description
        }
      } else {
        groupedItems.set(groupKey, {
          ...item,
          itemIds: [item.id] // Track all item IDs for this group
        })
      }
    })

    // Convert map to array
    const result = Array.from(groupedItems.values())

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching grouped items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grouped items' },
      { status: 500 }
    )
  }
}
