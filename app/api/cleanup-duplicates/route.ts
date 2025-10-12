import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    // === CLEANUP DUPLICATE ROOMS ===
    const rooms = await prisma.room.findMany({
      where: {
        householdId: household.id
      },
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: {
        createdAt: 'asc' // Keep the oldest one
      }
    })

    // Group rooms by name
    const roomGroups = rooms.reduce((acc, room) => {
      if (!acc[room.name]) {
        acc[room.name] = []
      }
      acc[room.name].push(room)
      return acc
    }, {} as Record<string, any[]>)

    let cleanedRooms = []
    let deletedRooms = []

    // For each group with duplicates, keep the oldest and delete the rest
    for (const [roomName, roomGroup] of Object.entries(roomGroups)) {
      if (roomGroup.length > 1) {
        // Keep the first (oldest) room
        cleanedRooms.push(roomGroup[0])
        
        // Delete the rest
        for (let i = 1; i < roomGroup.length; i++) {
          const roomToDelete = roomGroup[i]
          
          // Only delete if it has no items
          if (roomToDelete._count.items === 0) {
            await prisma.room.delete({
              where: { id: roomToDelete.id }
            })
            deletedRooms.push({
              id: roomToDelete.id,
              name: roomToDelete.name,
              type: 'room',
              reason: 'Deleted (no items)'
            })
          } else {
            deletedRooms.push({
              id: roomToDelete.id,
              name: roomToDelete.name,
              type: 'room',
              reason: 'Kept (has items)'
            })
          }
        }
      } else {
        cleanedRooms.push(roomGroup[0])
      }
    }

    // === CLEANUP DUPLICATE CATEGORIES ===
    const categories = await prisma.category.findMany({
      where: {
        householdId: household.id
      },
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: {
        createdAt: 'asc' // Keep the oldest one
      }
    })

    // Group categories by name, level, and parentId (exact duplicates)
    const categoryGroups = categories.reduce((acc, category) => {
      const key = `${category.name}_${category.level}_${category.parentId || 'null'}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(category)
      return acc
    }, {} as Record<string, any[]>)

    let cleanedCategories = []
    let deletedCategories = []

    // For each group with duplicates, keep the oldest and delete the rest
    for (const [key, categoryGroup] of Object.entries(categoryGroups)) {
      if (categoryGroup.length > 1) {
        // Keep the first (oldest) category
        cleanedCategories.push(categoryGroup[0])
        
        // Delete the rest
        for (let i = 1; i < categoryGroup.length; i++) {
          const categoryToDelete = categoryGroup[i]
          
          // Only delete if it has no items
          if (categoryToDelete._count.items === 0) {
            await prisma.category.delete({
              where: { id: categoryToDelete.id }
            })
            deletedCategories.push({
              id: categoryToDelete.id,
              name: categoryToDelete.name,
              level: categoryToDelete.level,
              type: 'category',
              reason: 'Deleted (no items)'
            })
          } else {
            deletedCategories.push({
              id: categoryToDelete.id,
              name: categoryToDelete.name,
              level: categoryToDelete.level,
              type: 'category',
              reason: 'Kept (has items)'
            })
          }
        }
      } else {
        cleanedCategories.push(categoryGroup[0])
      }
    }

    return NextResponse.json({
      message: 'Duplicate cleanup completed',
      rooms: {
        total: rooms.length,
        cleaned: cleanedRooms.length,
        deleted: deletedRooms,
        remainingDuplicates: Object.entries(roomGroups).filter(([_, group]) => group.length > 1).length
      },
      categories: {
        total: categories.length,
        cleaned: cleanedCategories.length,
        deleted: deletedCategories,
        remainingDuplicates: Object.entries(categoryGroups).filter(([_, group]) => group.length > 1).length
      }
    })
  } catch (error) {
    console.error('Error cleaning up duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
