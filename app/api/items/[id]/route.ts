import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const itemId = params.id
    const body = await request.json()
    const { roomId, cabinetId } = body

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Verify item belongs to user's household
    const existingItem = await prisma.item.findFirst({
      where: {
        id: itemId,
        householdId: household.id
      },
      include: {
        room: true,
        cabinet: true
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 })
    }

    // Verify new room belongs to user's household
    if (roomId) {
      const newRoom = await prisma.room.findFirst({
        where: {
          id: roomId,
          householdId: household.id
        }
      })
      if (!newRoom) {
        return NextResponse.json({ error: 'Destination room not found or access denied' }, { status: 404 })
      }
    }

    // Verify new cabinet belongs to the new room and user's household
    if (cabinetId) {
      const newCabinet = await prisma.cabinet.findFirst({
        where: {
          id: cabinetId,
          roomId: roomId,
          room: {
            householdId: household.id
          }
        }
      })
      if (!newCabinet) {
        return NextResponse.json({ error: 'Destination cabinet not found or access denied' }, { status: 404 })
      }
    }

    // Update the item
    const updatedItem = await prisma.item.update({
      where: {
        id: itemId
      },
      data: {
        roomId: roomId || null,
        cabinetId: cabinetId || null
      },
      include: {
        room: true,
        cabinet: true,
        category: true
      }
    })

    // Log item move history
    await prisma.itemHistory.create({
      data: {
        itemId: itemId,
        action: 'moved',
        description: `Item "${existingItem.name}" was moved`,
        oldRoomId: existingItem.roomId,
        newRoomId: roomId || null,
        oldCabinetId: existingItem.cabinetId,
        newCabinetId: cabinetId || null,
        performedBy: session.user.id
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}