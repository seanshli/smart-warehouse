import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Normalize names for cross-language comparison
function normalizeForComparison(name: string): string {
  const normalized = name.toLowerCase().trim()
  
  const chineseToEnglish: Record<string, string> = {
    '車庫': 'garage',
    '廚房': 'kitchen',
    '客廳': 'living room',
    '主臥室': 'master bedroom',
    '臥室': 'bedroom',
    '兒童房': 'kids room',
    '小孩房': 'kids room',
    '浴室': 'bathroom',
    '廁所': 'bathroom',
    '陽台': 'balcony',
    '儲藏室': 'storage',
    '書房': 'study',
    '餐廳': 'dining room',
    '服裝': 'clothing',
    '衣服': 'clothing',
  }
  
  if (chineseToEnglish[normalized]) {
    return chineseToEnglish[normalized]
  }
  
  for (const [chinese, english] of Object.entries(chineseToEnglish)) {
    if (normalized === chinese) {
      return english
    }
  }
  
  return normalized
}

/**
 * GET /api/admin/duplicates
 * Get all duplicates (items, rooms, categories)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Find duplicate items
    const allItems = await prisma.item.findMany({
      include: {
        household: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        cabinet: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    })

    const itemGroups = new Map<string, typeof allItems>()
    allItems.forEach(item => {
      const normalized = normalizeForComparison(item.name)
      if (!itemGroups.has(normalized)) {
        itemGroups.set(normalized, [])
      }
      itemGroups.get(normalized)!.push(item)
    })

    const duplicateItems = Array.from(itemGroups.entries())
      .filter(([_, items]) => items.length > 1)
      .flatMap(([_, items]) => items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        household: item.household.name,
        room: item.room?.name || '',
        cabinet: item.cabinet?.name || '',
        category: item.category?.name || '',
        similarity: 100,
      })))

    // Find duplicate rooms
    const allRooms = await prisma.room.findMany({
      include: {
        household: { select: { id: true, name: true } },
      },
    })

    const roomGroups = new Map<string, typeof allRooms>()
    allRooms.forEach(room => {
      const normalized = normalizeForComparison(room.name)
      if (!roomGroups.has(normalized)) {
        roomGroups.set(normalized, [])
      }
      roomGroups.get(normalized)!.push(room)
    })

    const duplicateRooms = Array.from(roomGroups.entries())
      .filter(([_, rooms]) => rooms.length > 1)
      .flatMap(([_, rooms]) => rooms.map(room => ({
        id: room.id,
        name: room.name,
        household: room.household.name,
        similarity: 100,
      })))

    // Find duplicate categories
    const allCategories = await prisma.category.findMany({
      include: {
        household: { select: { id: true, name: true } },
      },
    })

    const categoryGroups = new Map<string, typeof allCategories>()
    allCategories.forEach(category => {
      const normalized = normalizeForComparison(category.name)
      const key = `${normalized}_${category.level}_${category.parentId || 'null'}`
      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, [])
      }
      categoryGroups.get(key)!.push(category)
    })

    const duplicateCategories = Array.from(categoryGroups.entries())
      .filter(([_, categories]) => categories.length > 1)
      .flatMap(([_, categories]) => categories.map(category => ({
        id: category.id,
        name: category.name,
        household: category.household.name,
        level: category.level,
        similarity: 100,
      })))

    return NextResponse.json({
      success: true,
      items: duplicateItems,
      rooms: duplicateRooms,
      categories: duplicateCategories,
    })
  } catch (error: any) {
    console.error('Error fetching duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch duplicates', details: error.message },
      { status: 500 }
    )
  }
}
