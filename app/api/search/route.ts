import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { translateRoomName, translateCabinetName, translateCategoryName, translateItemContentEnhanced } from '@/lib/location-translations'
import { trackActivity } from '@/lib/activity-tracker'

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

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Get user's household
    const userRecord = await prisma.user.findUnique({
      where: { id: (session?.user as any)?.id },
      include: {
        householdMemberships: {
          include: {
            household: true
          }
        }
      }
    })

    if (!userRecord || !userRecord.householdMemberships.length) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    const householdId = userRecord.householdMemberships[0].household.id

    // Search for items that match the query
    // Also search in voice transcripts from item history
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
          },
          {
            history: {
              some: {
                voiceTranscript: {
                  contains: query,
                  mode: 'insensitive'
                } as any
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

    // Get user's language preference for translation
    const userLang = await prisma.user.findUnique({
      where: { id: (session?.user as any)?.id },
      select: { language: true }
    })
    const userLanguage = userLang?.language || 'en'

    // Format the results with translation
    const results = await Promise.all(items.map(async item => ({
      id: item.id,
      name: await translateItemContentEnhanced(item.name, userLanguage),
      description: await translateItemContentEnhanced(item.description || '', userLanguage),
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      imageUrl: item.imageUrl,
      category: item.category ? {
        id: item.category.id,
        name: translateCategoryName(item.category.name, userLanguage),
        parent: item.category.parent ? {
          name: translateCategoryName(item.category.parent.name, userLanguage)
        } : undefined
      } : undefined,
      room: item.room ? {
        id: item.room.id,
        name: translateRoomName(item.room.name, userLanguage)
      } : undefined,
      cabinet: item.cabinet ? {
        id: item.cabinet.id,
        name: translateCabinetName(item.cabinet.name, userLanguage)
      } : undefined
    })))

    // Track search activity (non-blocking)
    trackActivity({
      userId: (session?.user as any)?.id,
      householdId,
      activityType: 'search',
      action: 'search_items',
      description: `Searched for "${query}"`,
      metadata: {
        query,
        resultCount: results.length
      }
    }).catch(err => console.error('Failed to track search activity:', err))

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
