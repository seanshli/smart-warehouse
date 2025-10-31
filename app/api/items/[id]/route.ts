import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAndCreateNotifications } from '@/lib/notifications'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(
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

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
}

export async function PUT(
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

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        name: body.name,
        description: body.description,
        quantity: body.quantity,
        minQuantity: body.minQuantity,
        categoryId: body.categoryId,
        roomId: body.roomId,
        cabinetId: body.cabinetId,
        imageUrl: body.imageUrl,
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

    // Create activity record
    await prisma.itemHistory.create({
      data: {
        itemId: itemId,
        action: 'updated',
        description: `Item "${updatedItem.name}" was updated`,
        performedBy: userId
      }
    })

    // Create notifications for item update
    try {
      await checkAndCreateNotifications(updatedItem, userId, 'updated', item)
    } catch (error) {
      console.error('Failed to create notifications for item update:', error)
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function PATCH(
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

    // For PATCH, only update provided fields (e.g., quantity-only updates)
    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.quantity !== undefined) {
      if (body.quantity < 0) {
        return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 })
      }
      updateData.quantity = body.quantity
    }

    if (body.minQuantity !== undefined) {
      updateData.minQuantity = body.minQuantity
    }

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
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

    // Create activity record for quantity change
    if (body.quantity !== undefined && body.quantity !== item.quantity) {
      await prisma.itemHistory.create({
        data: {
          itemId: itemId,
          action: body.quantity > item.quantity ? 'quantity_increased' : 'quantity_decreased',
          description: `Quantity ${body.quantity > item.quantity ? 'increased' : 'decreased'} from ${item.quantity} to ${body.quantity}`,
          performedBy: userId
        }
      })

      // Create notifications for quantity change
      try {
        await checkAndCreateNotifications(updatedItem, userId, 'updated', item)
      } catch (error) {
        console.error('Failed to create notifications for quantity update:', error)
      }
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating item quantity:', error)
    return NextResponse.json({ error: 'Failed to update item quantity' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Create activity record before deletion

    // Delete the item
    await prisma.item.delete({
      where: { id: itemId }
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}