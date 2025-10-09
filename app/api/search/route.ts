import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] })
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
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    const householdId = user.householdMemberships[0].household.id

    // Search for items that match the query
    const items = await prisma.item.findMany({
      where: {
        householdId,
        OR: [
          {
            name: {
              contains: query
            }
          },
          {
            description: {
              contains: query,
            }
          },
          {
            category: {
              name: {
                contains: query,
              }
            }
          },
          {
            room: {
              name: {
                contains: query,
              }
            }
          },
          {
            cabinet: {
              name: {
                contains: query,
              }
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
      orderBy: [
        {
          name: 'asc'
        }
      ],
      take: 50 // Limit results to 50 items
    })

    // Format the results
    const results = items.map(item => ({
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

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
