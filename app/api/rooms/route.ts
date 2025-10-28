import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id

    const { searchParams } = new URL(request.url)
    const requestedHouseholdId = searchParams.get('householdId')
    const userLanguage = searchParams.get('language') || (session.user as any)?.language || 'en'

    // If a specific householdId is provided, validate membership and use it
    let householdIdToUse: string | null = null
    if (requestedHouseholdId) {
      const membership = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId: requestedHouseholdId } },
      })
      if (membership) {
        householdIdToUse = requestedHouseholdId
      }
    }

    // Fallback: use the first household the user belongs to
    if (!householdIdToUse) {
      const household = await prisma.household.findFirst({
        where: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
      householdIdToUse = household?.id || null
    }

    if (!householdIdToUse) {
      return NextResponse.json([])
    }

    const rooms = await prisma.room.findMany({
      where: {
        householdId: householdIdToUse
      },
      include: {
        cabinets: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Translate room names using room-translations
    const { getNormalizedRoomKey, getRoomDisplayName } = await import('@/lib/room-translations')
    const translatedRooms = rooms.map(room => {
      const normalizedKey = getNormalizedRoomKey(room.name)
      return {
        ...room,
        name: getRoomDisplayName(normalizedKey, userLanguage),
        originalName: room.name // Keep original for reference
      }
    })

    // Add debug information for duplicate checking
    const nameCounts = translatedRooms.reduce((acc, room) => {
      acc[room.name] = (acc[room.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const duplicates = Object.entries(nameCounts)
      .filter(([name, count]) => count > 1)
      .map(([name, count]) => ({ name, count }))

    return NextResponse.json({
      rooms: translatedRooms,
      debug: {
        totalRooms: translatedRooms.length,
        nameCounts,
        duplicates,
        householdId: householdIdToUse,
        userLanguage
      }
    })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id

    const body = await request.json()
    const { name, description, householdId } = body

    // Resolve target household for room creation
    let household = null as null | { id: string }
    if (householdId) {
      const membership = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } },
      })
      if (membership) {
        household = { id: householdId }
      }
    }

    if (!household) {
      household = await prisma.household.findFirst({
        where: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    }

    if (!household) {
      // Create a default household for the user
      household = await prisma.household.create({
        data: {
          name: `${session.user.name || session.user.email}'s Household`,
          members: {
            create: {
              userId: userId,
              role: 'OWNER'
            }
          }
        }
      })
    }

    // Check for duplicate room name in the same household (including cross-language duplicates)
    // Import translations to check for cross-language duplicates
    const { getTranslations } = await import('@/lib/translations')
    
    // Get all translations to check for cross-language duplicates
    const translations = {
      'en': getTranslations('en'),
      'zh-TW': getTranslations('zh-TW'),
      'zh': getTranslations('zh'),
      'ja': getTranslations('ja')
    }
    
    // Create a set of all possible names for this room across languages
    const allPossibleNames = new Set([name])
    
    // Add all translations of this room name
    Object.entries(translations).forEach(([langCode, t]) => {
      // Check if the name matches any of the default room translation keys
      if (name === t.livingRoom) {
        allPossibleNames.add('Living Room')
        allPossibleNames.add(t.livingRoom)
      }
      if (name === t.masterBedroom) {
        allPossibleNames.add('Master Bedroom')
        allPossibleNames.add(t.masterBedroom)
      }
      if (name === t.kidRoom) {
        allPossibleNames.add('Kids Room')
        allPossibleNames.add(t.kidRoom)
      }
      if (name === t.kitchen) {
        allPossibleNames.add('Kitchen')
        allPossibleNames.add(t.kitchen)
      }
      if (name === t.garage) {
        allPossibleNames.add('Garage')
        allPossibleNames.add(t.garage)
      }
      
      // Reverse check - if name is English, add all translations
      if (name === 'Living Room') allPossibleNames.add(t.livingRoom)
      if (name === 'Master Bedroom') allPossibleNames.add(t.masterBedroom)
      if (name === 'Kids Room') allPossibleNames.add(t.kidRoom)
      if (name === 'Kitchen') allPossibleNames.add(t.kitchen)
      if (name === 'Garage') allPossibleNames.add(t.garage)
    })
    
    // Debug logging
    console.log('Room duplicate check debug:', {
      newRoomName: name,
      allPossibleNames: Array.from(allPossibleNames),
      translations: Object.entries(translations).map(([lang, t]) => ({
        language: lang,
        livingRoom: t.livingRoom,
        masterBedroom: t.masterBedroom,
        kidRoom: t.kidRoom,
        kitchen: t.kitchen,
        garage: t.garage
      }))
    })
    
    const existingRoom = await prisma.room.findFirst({
      where: {
        name: { in: Array.from(allPossibleNames) },
        householdId: household.id
      }
    })

    if (existingRoom) {
      return NextResponse.json(
        { 
          error: 'Room with this name already exists',
          duplicateName: name,
          suggestion: `Consider using a different name or check if you meant to edit the existing "${name}" room.`
        },
        { status: 409 }
      )
    }

    const room = await prisma.room.create({
      data: {
        name,
        description,
        householdId: household.id
      }
    })

    // Log room creation in activity history
    try {
    } catch (logError) {
      console.error('Error logging room creation:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}


