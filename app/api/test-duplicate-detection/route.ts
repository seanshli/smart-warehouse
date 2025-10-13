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

    // Test room duplicate detection logic
    const testRoomNames = ['Kids Room', '廚房', '兒童房']
    
    // Get all translations to check for cross-language duplicates
    const translations = {
      'en': getTranslations('en'),
      'zh-TW': getTranslations('zh-TW'),
      'zh': getTranslations('zh'),
      'ja': getTranslations('ja')
    }
    
    const results = testRoomNames.map(testRoomName => {
      // Create a set of all possible names for this room across languages
      const allPossibleNames = new Set([testRoomName])
      
      // Add all translations of this room name
      Object.entries(translations).forEach(([langCode, t]) => {
        // Check if the name matches any of the default room translation keys
        if (testRoomName === t.livingRoom || testRoomName === 'Living Room') {
          allPossibleNames.add('Living Room')
          allPossibleNames.add(t.livingRoom)
        }
        if (testRoomName === t.masterBedroom || testRoomName === 'Master Bedroom') {
          allPossibleNames.add('Master Bedroom')
          allPossibleNames.add(t.masterBedroom)
        }
        if (testRoomName === t.kidRoom || testRoomName === 'Kids Room') {
          allPossibleNames.add('Kids Room')
          allPossibleNames.add(t.kidRoom)
        }
        if (testRoomName === t.kitchen || testRoomName === 'Kitchen') {
          allPossibleNames.add('Kitchen')
          allPossibleNames.add(t.kitchen)
        }
        if (testRoomName === t.garage || testRoomName === 'Garage') {
          allPossibleNames.add('Garage')
          allPossibleNames.add(t.garage)
        }
      })
      
      return {
        testRoomName,
        allPossibleNames: Array.from(allPossibleNames)
      }
    })

    // Get all rooms for reference
    const allRooms = await prisma.room.findMany({
      where: {
        householdId: household.id
      }
    })

    return NextResponse.json({
      testResults: results,
      translations: Object.entries(translations).map(([lang, t]) => ({
        language: lang,
        livingRoom: t.livingRoom,
        masterBedroom: t.masterBedroom,
        kidRoom: t.kidRoom,
        kitchen: t.kitchen,
        garage: t.garage
      })),
      allRooms: allRooms.map(room => ({ id: room.id, name: room.name })),
      householdId: household.id
    })
  } catch (error) {
    console.error('Error testing duplicate detection:', error)
    return NextResponse.json(
      { error: 'Failed to test duplicate detection' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
