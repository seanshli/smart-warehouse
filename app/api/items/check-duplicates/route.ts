import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    // Get all items for this household
    const items = await prisma.item.findMany({
      where: {
        householdId: household.id
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        room: {
          select: {
            name: true
          }
        },
        cabinet: {
          select: {
            name: true
          }
        }
      }
    })

    // Group items by normalized name (case-insensitive)
    const itemGroups = new Map<string, any[]>()
    
    items.forEach(item => {
      const normalizedName = item.name.trim().toLowerCase()
      if (!itemGroups.has(normalizedName)) {
        itemGroups.set(normalizedName, [])
      }
      itemGroups.get(normalizedName)!.push(item)
    })

    // Find duplicates (items with same name that appear in multiple locations)
    const duplicates = Array.from(itemGroups.entries())
      .filter(([_name, items]) => items.length > 1)
      .map(([name, items]) => ({
        name: items[0].name, // Original casing
        normalizedName: name,
        count: items.length,
        locations: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          room: item.room?.name || null,
          cabinet: item.cabinet?.name || null
        }))
      }))

    return NextResponse.json({
      totalItems: items.length,
      duplicateGroups: duplicates.length,
      duplicates: duplicates
    })
  } catch (error) {
    console.error('Error checking item duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    )
  }
}
