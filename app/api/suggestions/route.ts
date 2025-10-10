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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: (session?.user as any)?.id },
      include: {
        householdMemberships: {
          include: {
            household: true
          }
        }
      }
    })

    if (!user || !user.householdMemberships.length) {
      return NextResponse.json({ suggestions: [] })
    }

    const householdId = user.householdMemberships[0].household.id

    // Search for items that match the query
    const items = await prisma.item.findMany({
      where: {
        householdId,
        OR: [
          {
            name: {
              contains: query,
            }
          },
          {
            description: {
              contains: query,
            }
          }
        ]
      },
      include: {
        category: {
          include: {
            parent: true
          }
        },
        room: true,
        cabinet: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 10 // Limit suggestions to 10 items
    })

    // Format the suggestions
    const suggestions = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      imageUrl: item.imageUrl,
      category: item.category ? {
        name: item.category.name,
        level: item.category.level,
        parent: item.category.parent ? {
          name: item.category.parent.name,
          level: item.category.parent.level
        } : undefined
      } : undefined,
      room: item.room ? {
        name: item.room.name
      } : undefined,
      cabinet: item.cabinet ? {
        name: item.cabinet.name
      } : undefined
    }))

    return NextResponse.json({ suggestions })

  } catch (error) {
    console.error('Suggestions error:', error)
    return NextResponse.json(
      { suggestions: [] },
      { status: 500 }
    )
  }
}
