import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      console.log('[rooms] GET /api/rooms/[id]/items - Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomId = params.id
    const { searchParams } = new URL(request.url)
    const userLanguage = searchParams.get('language') || (session?.user as any)?.language || 'en'
    console.log('[rooms] GET /api/rooms/[id]/items - roomId:', roomId, 'userId:', (session?.user as any)?.id, 'language:', userLanguage)

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: (session?.user as any)?.id
          }
        }
      }
    })

    if (!household) {
      console.log('[rooms] GET /api/rooms/[id]/items - Household not found for user:', (session?.user as any)?.id)
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Get room with cabinets and items
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        householdId: household.id
      },
      include: {
        cabinets: {
          include: {
            items: {
              include: {
                category: true
              }
            },
            _count: {
              select: {
                items: true
              }
            }
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    if (!room) {
      console.log('[rooms] GET /api/rooms/[id]/items - Room not found:', roomId, 'householdId:', household.id)
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Enrich items with total quantity across all locations for min quantity calculation
    if (room.cabinets) {
      // Get all items in household to calculate totals
      const allHouseholdItems = await prisma.item.findMany({
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

      // Group items by normalized name and calculate totals
      const itemTotals = new Map<string, { totalQuantity: number, minQuantity: number | null }>()
      allHouseholdItems.forEach(item => {
        const normalizedName = item.name.trim().toLowerCase()
        if (!itemTotals.has(normalizedName)) {
          itemTotals.set(normalizedName, { totalQuantity: 0, minQuantity: item.minQuantity })
        }
        const existing = itemTotals.get(normalizedName)!
        existing.totalQuantity += item.quantity
        // Use the most restrictive minQuantity
        if (item.minQuantity !== null) {
          existing.minQuantity = existing.minQuantity !== null 
            ? Math.min(existing.minQuantity, item.minQuantity)
            : item.minQuantity
        }
      })

      // Enrich items in room with total quantity and isLowStock
      room.cabinets = room.cabinets.map(cabinet => ({
        ...cabinet,
        items: cabinet.items.map((item: any) => {
          const normalizedName = item.name.trim().toLowerCase()
          const totals = itemTotals.get(normalizedName) || { totalQuantity: item.quantity, minQuantity: item.minQuantity }
          const isLowStock = totals.minQuantity !== null && totals.totalQuantity <= totals.minQuantity
          
          return {
            ...item,
            totalQuantity: totals.totalQuantity,
            isLowStock
          }
        })
      }))
    }

    // Translate room name
    const { getNormalizedRoomKey, getRoomDisplayName } = await import('@/lib/room-translations')
    if (room.name) {
      const normalizedRoomKey = getNormalizedRoomKey(room.name)
      room.name = getRoomDisplayName(normalizedRoomKey, userLanguage)
    }

    console.log('[rooms] GET /api/rooms/[id]/items - Success:', roomId, 'cabinets:', room.cabinets?.length || 0, 'items:', room._count?.items || 0)
    return NextResponse.json(room)
  } catch (error) {
    console.error('Error fetching room details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room details' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
