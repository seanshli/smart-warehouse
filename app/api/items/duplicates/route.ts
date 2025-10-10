import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const url = new URL(request.url)
    const householdId = url.searchParams.get('householdId')

    if (!householdId) {
      return NextResponse.json({ error: 'Household ID required' }, { status: 400 })
    }

    // Verify user has access to this household
    const household = await prisma.household.findFirst({
      where: {
        id: householdId,
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

    // Find potential duplicates by name and location
    const items = await prisma.item.findMany({
      where: {
        householdId: householdId
      },
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

    // Group items by potential duplicates
    const duplicateGroups: { [key: string]: any[] } = {}
    
    items.forEach(item => {
      // Create a key based on name only (more flexible duplicate detection)
      const key = `${item.name.toLowerCase().trim()}`
      
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = []
      }
      duplicateGroups[key].push(item)
    })

    // Filter to only groups with duplicates
    const duplicates = Object.values(duplicateGroups).filter(group => group.length > 1)

    console.log('Duplicate detection results:', {
      totalItems: items.length,
      duplicateGroups: Object.keys(duplicateGroups).length,
      duplicatesFound: duplicates.length,
      groups: Object.entries(duplicateGroups).map(([key, group]) => ({
        key,
        count: group.length,
        items: group.map(item => ({ id: item.id, name: item.name, room: item.room?.name, cabinet: item.cabinet?.name }))
      }))
    })

    return NextResponse.json(duplicates)
  } catch (error) {
    console.error('Error finding duplicates:', error)
    return NextResponse.json({ error: 'Failed to find duplicates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()
    const { itemIds, targetItemId } = body

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'Item IDs required' }, { status: 400 })
    }

    if (!targetItemId) {
      return NextResponse.json({ error: 'Target item ID required' }, { status: 400 })
    }

    // Verify user has access to all items
    const items = await prisma.item.findMany({
      where: {
        id: {
          in: [...itemIds, targetItemId]
        },
        household: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      }
    })

    if (items.length !== itemIds.length + 1) {
      return NextResponse.json({ error: 'Some items not found or access denied' }, { status: 404 })
    }

    const targetItem = items.find(item => item.id === targetItemId)
    const sourceItems = items.filter(item => itemIds.includes(item.id))

    if (!targetItem) {
      return NextResponse.json({ error: 'Target item not found' }, { status: 404 })
    }

    // Calculate total quantity
    const totalQuantity = sourceItems.reduce((sum, item) => sum + item.quantity, 0) + targetItem.quantity

    // Get the most recent item's details for description and other fields
    const mostRecentItem = [targetItem, ...sourceItems].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0]

    // Update target item with combined quantity and best description
    const updatedItem = await prisma.item.update({
      where: { id: targetItemId },
      data: {
        quantity: totalQuantity,
        description: mostRecentItem.description || targetItem.description,
        imageUrl: mostRecentItem.imageUrl || targetItem.imageUrl,
        updatedAt: new Date()
      },
      include: {
        category: {
          include: {
            parent: true
          }
        },
        room: true,
        cabinet: true
      }
    })

    // Create activity record for the combine operation
    await prisma.itemHistory.create({
      data: {
        itemId: targetItemId,
        action: 'quantity_updated',
        description: `Item "${updatedItem.name}" quantity updated to ${totalQuantity} (combined ${sourceItems.length + 1} items)`,
        performedBy: userId
      }
    })

    // Delete source items
    await prisma.item.deleteMany({
      where: {
        id: {
          in: itemIds
        }
      }
    })

    return NextResponse.json({
      message: 'Items combined successfully',
      updatedItem,
      combinedCount: sourceItems.length
    })
  } catch (error) {
    console.error('Error combining items:', error)
    return NextResponse.json({ error: 'Failed to combine items' }, { status: 500 })
  }
}
