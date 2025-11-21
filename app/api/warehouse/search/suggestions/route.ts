import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json([])
    }

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
      return NextResponse.json([])
    }

    // Search for items that match the query
    const items = await prisma.item.findMany({
      where: {
        householdId: household.id,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { barcode: { contains: query } },
          { qrCode: { contains: query } }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: {
          select: {
            name: true,
            level: true,
            parent: {
              select: {
                name: true,
                level: true
              }
            }
          }
        },
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
      },
      take: 5, // Limit to 5 suggestions
      orderBy: {
        name: 'asc'
      }
    })

    // Search for rooms that match the query
    const rooms = await prisma.room.findMany({
      where: {
        householdId: household.id,
        name: { contains: query }
      },
      select: {
        id: true,
        name: true,
        description: true
      },
      take: 3,
      orderBy: {
        name: 'asc'
      }
    })

    // Search for categories that match the query (including subcategories)
    const categories = await prisma.category.findMany({
      where: {
        householdId: household.id,
        name: { contains: query }
      },
      select: {
        id: true,
        name: true,
        level: true,
        parent: {
          select: {
            name: true,
            level: true
          }
        }
      },
      take: 3,
      orderBy: {
        name: 'asc'
      }
    })

    // Also search for similar item names (for fuzzy matching)
    const similarItems = await prisma.item.findMany({
      where: {
        householdId: household.id,
        name: {
          contains: query
        }
      },
      select: {
        name: true
      },
      distinct: ['name'],
      take: 3
    })

    // Create suggestions array
    const itemSuggestions = items.map(item => ({
      type: 'item',
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category?.name,
      categoryLevel: item.category?.level,
      parentCategory: item.category?.parent?.name,
      location: `${item.room?.name}${item.cabinet?.name ? ` - ${item.cabinet.name}` : ''}`,
      searchText: `${item.name} ${item.description || ''}`.toLowerCase()
    }))

    // Add room suggestions
    const roomSuggestions = rooms.map(room => ({
      type: 'room',
      id: room.id,
      name: room.name,
      description: room.description || `Room: ${room.name}`,
      searchText: room.name.toLowerCase()
    }))

    // Add category suggestions
    const categorySuggestions = categories.map(category => ({
      type: 'category',
      id: category.id,
      name: category.name,
      description: category.parent ? 
        `Category: ${category.parent.name} > ${category.name}` : 
        `Category: ${category.name}`,
      categoryLevel: category.level,
      parentCategory: category.parent?.name,
      searchText: category.name.toLowerCase()
    }))

    // Add item name suggestions
    const nameSuggestions = similarItems
      .filter(item => !itemSuggestions.some(s => s.name.toLowerCase() === item.name.toLowerCase()))
      .map(item => ({
        type: 'name',
        name: item.name,
        searchText: item.name.toLowerCase()
      }))

    return NextResponse.json({
      suggestions: [...itemSuggestions, ...roomSuggestions, ...categorySuggestions, ...nameSuggestions],
      query: query
    })

  } catch (error) {
    console.error('Error fetching search suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}
