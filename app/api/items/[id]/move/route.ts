import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      },
      include: {
        room: true,
        cabinet: true
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Get new location details
    const newRoom = await prisma.room.findUnique({
      where: { id: body.roomId }
    })

    const newCabinet = body.cabinetId ? await prisma.cabinet.findUnique({
      where: { id: body.cabinetId }
    }) : null

    if (!newRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (body.cabinetId && !newCabinet) {
      return NextResponse.json({ error: 'Cabinet not found' }, { status: 404 })
    }

    // Update the item location
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        roomId: body.roomId,
        cabinetId: body.cabinetId,
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
    const oldLocation = item.room?.name + (item.cabinet?.name ? ` → ${item.cabinet.name}` : '')
    const newLocation = newRoom.name + (newCabinet?.name ? ` → ${newCabinet.name}` : '')
    
    await prisma.itemHistory.create({
      data: {
        itemId: itemId,
        action: 'moved',
        description: `Item "${updatedItem.name}" moved from ${oldLocation} to ${newLocation}`,
        oldRoomId: item.roomId,
        newRoomId: body.roomId,
        oldCabinetId: item.cabinetId,
        newCabinetId: body.cabinetId,
        performedBy: userId
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error moving item:', error)
    return NextResponse.json({ error: 'Failed to move item' }, { status: 500 })
  }
}
