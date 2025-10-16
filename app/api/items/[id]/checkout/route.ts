import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CacheInvalidation } from '@/lib/cache'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const itemId = params.id
    const body = await request.json()

    // Verify user has access to this item
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        household: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const checkoutQuantity = parseInt(body.quantity)
    const reason = body.reason || 'Checked out'

    if (checkoutQuantity <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    if (checkoutQuantity > item.quantity) {
      return NextResponse.json({ error: 'Cannot checkout more items than available' }, { status: 400 })
    }

    // Update the item quantity
    const newQuantity = item.quantity - checkoutQuantity
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
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

    // Log checkout activity
    await prisma.itemHistory.create({
      data: {
        itemId: itemId,
        action: 'checkout',
        description: `Item checked out. Quantity decreased from ${item.quantity} to ${newQuantity}`,
        performedBy: userId
      }
    })

    // Clear cache after checkout to ensure UI reflects updated quantity
    if (item.householdId) {
      CacheInvalidation.clearItemCache(item.householdId)
      console.log('Checkout: Cleared cache for household:', item.householdId)
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error checking out item:', error)
    return NextResponse.json({ error: 'Failed to checkout item' }, { status: 500 })
  }
}