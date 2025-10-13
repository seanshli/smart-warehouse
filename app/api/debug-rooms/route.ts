import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'
import { getTranslations } from '@/lib/translations'

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
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    // Get all rooms
    const rooms = await prisma.room.findMany({
      where: {
        householdId: household.id
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get translations
    const translations = {
      'en': getTranslations('en'),
      'zh-TW': getTranslations('zh-TW'),
      'zh': getTranslations('zh'),
      'ja': getTranslations('ja')
    }

    // Test duplicate detection for each room
    const duplicateTests = rooms.map(room => {
      const allPossibleNames = new Set([room.name])
      
      // Add all translations of this room name
      Object.entries(translations).forEach(([langCode, t]) => {
        // Check if the name matches any of the default room translation keys
        if (room.name === t.livingRoom || room.name === 'Living Room') {
          allPossibleNames.add('Living Room')
          allPossibleNames.add(t.livingRoom)
        }
        if (room.name === t.masterBedroom || room.name === 'Master Bedroom') {
          allPossibleNames.add('Master Bedroom')
          allPossibleNames.add(t.masterBedroom)
        }
        if (room.name === t.kidRoom || room.name === 'Kids Room') {
          allPossibleNames.add('Kids Room')
          allPossibleNames.add(t.kidRoom)
        }
        if (room.name === t.kitchen || room.name === 'Kitchen') {
          allPossibleNames.add('Kitchen')
          allPossibleNames.add(t.kitchen)
        }
        if (room.name === t.garage || room.name === 'Garage') {
          allPossibleNames.add('Garage')
          allPossibleNames.add(t.garage)
        }
      })

      return {
        roomName: room.name,
        roomId: room.id,
        allPossibleNames: Array.from(allPossibleNames),
        wouldConflictWith: rooms.filter(otherRoom => 
          otherRoom.id !== room.id && 
          Array.from(allPossibleNames).includes(otherRoom.name)
        ).map(otherRoom => ({ name: otherRoom.name, id: otherRoom.id }))
      }
    })

    return NextResponse.json({
      householdId: household.id,
      totalRooms: rooms.length,
      rooms: rooms.map(room => ({ id: room.id, name: room.name, createdAt: room.createdAt })),
      translations: Object.entries(translations).map(([lang, t]) => ({
        language: lang,
        livingRoom: t.livingRoom,
        masterBedroom: t.masterBedroom,
        kidRoom: t.kidRoom,
        kitchen: t.kitchen,
        garage: t.garage
      })),
      duplicateTests,
      nameCounts: rooms.reduce((acc, room) => {
        acc[room.name] = (acc[room.name] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    })
  } catch (error) {
    console.error('Error debugging rooms:', error)
    return NextResponse.json(
      { error: 'Failed to debug rooms' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
