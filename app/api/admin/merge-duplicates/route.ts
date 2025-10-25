import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const { type, primaryId, duplicateId } = await request.json()

    if (!type || !primaryId || !duplicateId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    if (type === 'items') {
      // Get the primary and duplicate items
      const primaryItem = await prisma.item.findUnique({
        where: { id: primaryId },
        include: { category: true, room: true, cabinet: true }
      })

      const duplicateItem = await prisma.item.findUnique({
        where: { id: duplicateId },
        include: { category: true, room: true, cabinet: true }
      })

      if (!primaryItem || !duplicateItem) {
        return NextResponse.json({ error: 'Items not found' }, { status: 404 })
      }

      // Merge quantities
      const newQuantity = primaryItem.quantity + duplicateItem.quantity

      // Update primary item with combined quantity
      await prisma.item.update({
        where: { id: primaryId },
        data: { quantity: newQuantity }
      })

      // Create activity record for the merge
      await prisma.itemHistory.create({
        data: {
          itemId: primaryId,
          action: 'merged',
          description: `Item "${duplicateItem.name}" merged into "${primaryItem.name}" (combined quantity: ${newQuantity})`,
          performedBy: userId
        }
      })

      // Delete the duplicate item
      await prisma.item.delete({
        where: { id: duplicateId }
      })

      return NextResponse.json({ 
        message: 'Items merged successfully',
        mergedQuantity: newQuantity
      })

    } else if (type === 'rooms') {
      // Get the primary and duplicate rooms
      const primaryRoom = await prisma.room.findUnique({
        where: { id: primaryId },
        include: { items: true }
      })

      const duplicateRoom = await prisma.room.findUnique({
        where: { id: duplicateId },
        include: { items: true }
      })

      if (!primaryRoom || !duplicateRoom) {
        return NextResponse.json({ error: 'Rooms not found' }, { status: 404 })
      }

      // Move all items from duplicate room to primary room
      await prisma.item.updateMany({
        where: { roomId: duplicateId },
        data: { roomId: primaryId }
      })

      // Create activity record for the merge
      await prisma.itemHistory.createMany({
        data: duplicateRoom.items.map(item => ({
          itemId: item.id,
          action: 'moved',
          description: `Room "${duplicateRoom.name}" merged into "${primaryRoom.name}"`,
          oldRoomId: duplicateId,
          newRoomId: primaryId,
          performedBy: userId
        }))
      })

      // Delete the duplicate room
      await prisma.room.delete({
        where: { id: duplicateId }
      })

      return NextResponse.json({ 
        message: 'Rooms merged successfully',
        movedItems: duplicateRoom.items.length
      })

    } else if (type === 'categories') {
      // Get the primary and duplicate categories
      const primaryCategory = await prisma.category.findUnique({
        where: { id: primaryId },
        include: { items: true, children: true }
      })

      const duplicateCategory = await prisma.category.findUnique({
        where: { id: duplicateId },
        include: { items: true, children: true }
      })

      if (!primaryCategory || !duplicateCategory) {
        return NextResponse.json({ error: 'Categories not found' }, { status: 404 })
      }

      // Move all items from duplicate category to primary category
      await prisma.item.updateMany({
        where: { categoryId: duplicateId },
        data: { categoryId: primaryId }
      })

      // Move all children from duplicate category to primary category
      await prisma.category.updateMany({
        where: { parentId: duplicateId },
        data: { parentId: primaryId }
      })

      // Create activity record for the merge
      await prisma.itemHistory.createMany({
        data: duplicateCategory.items.map(item => ({
          itemId: item.id,
          action: 'moved',
          description: `Category "${duplicateCategory.name}" merged into "${primaryCategory.name}"`,
          performedBy: userId
        }))
      })

      // Delete the duplicate category
      await prisma.category.delete({
        where: { id: duplicateId }
      })

      return NextResponse.json({ 
        message: 'Categories merged successfully',
        movedItems: duplicateCategory.items.length,
        movedChildren: duplicateCategory.children.length
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Error merging duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to merge duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
