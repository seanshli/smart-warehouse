import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    // Find Panasonic controller items
    const panasonicItems = await prisma.item.findMany({
      where: {
        householdId: household.id,
        name: {
          contains: 'Panasonic'
        }
      },
      include: {
        room: true,
        cabinet: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log('Found Panasonic items:', panasonicItems.length)

    if (panasonicItems.length <= 1) {
      return NextResponse.json({
        message: 'No duplicates found',
        items: panasonicItems.length
      })
    }

    // Keep the first (oldest) item, delete the rest
    const keepItem = panasonicItems[0]
    const deleteItems = panasonicItems.slice(1)

    console.log('Keeping item:', keepItem.id, keepItem.name)
    console.log('Deleting items:', deleteItems.map(item => ({ id: item.id, name: item.name })))

    // Calculate total quantity
    const totalQuantity = panasonicItems.reduce((sum, item) => sum + item.quantity, 0)

    // Update the kept item with combined quantity
    const updatedItem = await prisma.item.update({
      where: { id: keepItem.id },
      data: {
        quantity: totalQuantity
      }
    })

    // Create activity record
    await prisma.itemHistory.create({
      data: {
        itemId: keepItem.id,
        action: 'quantity_updated',
        description: `Item "${keepItem.name}" quantity updated to ${totalQuantity} (combined ${panasonicItems.length} duplicate items)`,
        performedBy: userId
      }
    })

    // Delete duplicate items
    await prisma.item.deleteMany({
      where: {
        id: {
          in: deleteItems.map(item => item.id)
        }
      }
    })

    return NextResponse.json({
      message: 'Panasonic duplicates cleaned up successfully',
      keptItem: {
        id: keepItem.id,
        name: keepItem.name,
        quantity: totalQuantity
      },
      deletedCount: deleteItems.length,
      deletedItems: deleteItems.map(item => ({
        id: item.id,
        name: item.name
      }))
    })

  } catch (error) {
    console.error('Error cleaning up Panasonic duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup duplicates' },
      { status: 500 }
    )
  }
}
