import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const itemId = params.id
    const userId = (session?.user as any)?.id
    const body = await request.json()
    const { quantity, reason } = body

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 })
    }

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

    // Verify item belongs to user's household
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        householdId: household.id
      },
      include: {
        room: true,
        cabinet: true,
        category: true
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 })
    }

    if (item.quantity < quantity) {
      return NextResponse.json(
        { error: `Insufficient quantity. Available: ${item.quantity}, Requested: ${quantity}` },
        { status: 400 }
      )
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update item quantity
      const updatedItem = await tx.item.update({
        where: {
          id: itemId
        },
        data: {
          quantity: item.quantity - quantity,
          updatedAt: new Date()
        },
        include: {
          room: true,
          cabinet: true,
          category: true
        }
      })

      // Log checkout in item history
      await tx.itemHistory.create({
        data: {
          itemId: itemId,
          action: 'checkout',
          description: `Checked out ${quantity} ${item.name}${reason ? ` - Reason: ${reason}` : ''}`,
          performedBy: userId
        }
      })

      // Check if quantity is now below threshold and create notification
      if (updatedItem.quantity <= updatedItem.minQuantity) {
        await tx.notification.create({
          data: {
            type: 'LOW_INVENTORY',
            title: 'Low Inventory Alert',
            message: `${item.name} is running low (${updatedItem.quantity} remaining)`,
            userId: userId,
            householdId: household.id,
            itemId: itemId
          }
        })
      }

      // If quantity reaches 0, create out-of-stock notification
      if (updatedItem.quantity === 0) {
        await tx.notification.create({
          data: {
            type: 'OUT_OF_STOCK',
            title: 'Out of Stock Alert',
            message: `${item.name} is now out of stock`,
            userId: userId,
            householdId: household.id,
            itemId: itemId
          }
        })
      }

      return updatedItem
    })

    return NextResponse.json({
      message: 'Items checked out successfully',
      item: result,
      quantityCheckedOut: quantity,
      remainingQuantity: result.quantity
    })
  } catch (error) {
    console.error('Error checking out item:', error)
    return NextResponse.json(
      { error: 'Failed to checkout item' },
      { status: 500 }
    )
  }
}
