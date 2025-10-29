import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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
    const { roomId, cabinetId, categoryId, quantity = 1 } = body

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
      },
      include: {
        room: true,
        cabinet: true
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Validate quantity
    if (quantity < 1 || quantity > item.quantity) {
      return NextResponse.json({ 
        error: `Invalid quantity. Available: ${item.quantity}, Requested: ${quantity}` 
      }, { status: 400 })
    }

    // Get new location details
    const newRoom = await prisma.room.findUnique({
      where: { id: roomId }
    })

    const newCabinet = cabinetId ? await prisma.cabinet.findUnique({
      where: { id: cabinetId }
    }) : null

    const newCategory = categoryId ? await prisma.category.findUnique({
      where: { id: categoryId }
    }) : null

    if (!newRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (cabinetId && !newCabinet) {
      return NextResponse.json({ error: 'Cabinet not found' }, { status: 404 })
    }

    if (categoryId && !newCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Handle partial move vs full move
    if (quantity === item.quantity) {
      // Full move - update the existing item
      const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: {
          roomId: roomId,
          cabinetId: cabinetId,
          categoryId: categoryId || undefined,
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

      // Create activity record for full move
      const oldLocation = item.room?.name + (item.cabinet?.name ? ` → ${item.cabinet.name}` : '')
      const newLocation = newRoom.name + (newCabinet?.name ? ` → ${newCabinet.name}` : '')
      
      let description = `Item "${updatedItem.name}" moved from ${oldLocation} to ${newLocation}`
      
      // Add category change info if applicable
      if (categoryId && newCategory) {
        description += ` and category changed to ${newCategory.name}`
      }
      
      await prisma.itemHistory.create({
        data: {
          itemId: itemId,
          action: 'moved',
          description: description,
          oldRoomId: item.roomId,
          newRoomId: roomId,
          oldCabinetId: item.cabinetId,
          newCabinetId: cabinetId,
          performedBy: userId
        }
      })

      return NextResponse.json(updatedItem)
    } else {
      // Partial move - reduce original item quantity and create new item
      const remainingQuantity = item.quantity - quantity
      
      // Update original item with reduced quantity
      await prisma.item.update({
        where: { id: itemId },
        data: {
          quantity: remainingQuantity,
          updatedAt: new Date()
        }
      })

      // Create new item at new location
      const newItem = await prisma.item.create({
        data: {
          name: item.name,
          description: item.description,
          quantity: quantity,
          minQuantity: item.minQuantity,
          barcode: item.barcode,
          qrCode: item.qrCode,
          imageUrl: item.imageUrl,
          roomId: roomId,
          cabinetId: cabinetId,
          categoryId: categoryId || item.categoryId,
          householdId: item.householdId,
          addedById: userId
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

      // Create activity records
      const oldLocation = item.room?.name + (item.cabinet?.name ? ` → ${item.cabinet.name}` : '')
      const newLocation = newRoom.name + (newCabinet?.name ? ` → ${newCabinet.name}` : '')
      
      // Record for original item (quantity reduced)
      await prisma.itemHistory.create({
        data: {
          itemId: itemId,
          action: 'quantity_reduced',
          description: `Item "${item.name}" quantity reduced by ${quantity} (moved to new location)`,
          oldRoomId: item.roomId,
          newRoomId: item.roomId,
          oldCabinetId: item.cabinetId,
          newCabinetId: item.cabinetId,
          performedBy: userId
        }
      })

      // Record for new item (created at new location)
      await prisma.itemHistory.create({
        data: {
          itemId: newItem.id,
          action: 'moved',
          description: `Item "${newItem.name}" (${quantity} units) moved from ${oldLocation} to ${newLocation}`,
          oldRoomId: item.roomId,
          newRoomId: roomId,
          oldCabinetId: item.cabinetId,
          newCabinetId: cabinetId,
          performedBy: userId
        }
      })

      return NextResponse.json(newItem)
    }
  } catch (error) {
    console.error('Error moving item:', error)
    return NextResponse.json({ error: 'Failed to move item' }, { status: 500 })
  }
}
