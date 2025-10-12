import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id

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

    // Get all items with their quantities and min quantities
    const items = await prisma.item.findMany({
      where: {
        householdId: household.id
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        minQuantity: true
      }
    })

    // Calculate low stock items
    const lowStockItems = items.filter(item => item.quantity <= item.minQuantity)

    return NextResponse.json({
      totalItems: items.length,
      items: items,
      lowStockItems: lowStockItems,
      lowStockCount: lowStockItems.length,
      debug: {
        householdId: household.id,
        userId: userId,
        itemsWithLowStock: lowStockItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          isLowStock: item.quantity <= item.minQuantity
        }))
      }
    })
  } catch (error) {
    console.error('Error in debug low stock:', error)
    return NextResponse.json(
      { error: 'Failed to debug low stock', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
