import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomId = params.id
    const userId = (session?.user as any)?.id
    const body = await request.json()
    const { name, description } = body

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

    // Verify room belongs to user's household
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        householdId: household.id
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 })
    }

    // Check for duplicate room name if name is being changed
    if (name && name !== room.name) {
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
      
      const existingRoom = await prisma.room.findFirst({
        where: {
          name: { in: Array.from(allPossibleNames) },
          householdId: household.id,
          id: { not: roomId } // Exclude current room
        }
      })

      if (existingRoom) {
        return NextResponse.json(
          { 
            error: 'Room with this name already exists (including translations)',
            duplicateName: name,
            existingName: existingRoom.name,
            suggestion: `Consider using a different name or check if you meant to edit the existing "${existingRoom.name}" room.`
          },
          { status: 409 }
        )
      }
    }

    // Update the room
    const updatedRoom = await prisma.room.update({
      where: {
        id: roomId
      },
      data: {
        name: name,
        description: description
      }
    })

    return NextResponse.json(updatedRoom)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomId = params.id
    const userId = (session?.user as any)?.id

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

    // Verify room belongs to user's household
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        householdId: household.id
      },
      include: {
        _count: {
          select: {
            items: true,
            cabinets: true
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 })
    }

    // Check if room has items
    if (room._count.items > 0) {
      return NextResponse.json(
        { error: `Cannot delete room. It contains ${room._count.items} item(s). Please move or delete all items first.` },
        { status: 400 }
      )
    }

    // Log room deletion before deleting
    try {
      // Find the room log item for this room
      const roomLogItem = await prisma.item.findFirst({
        where: {
          name: `[ROOM] ${room.name}`,
          roomId: roomId,
          householdId: household.id
        }
      })

      if (roomLogItem) {
      }
    } catch (logError) {
      console.error('Error logging room deletion:', logError)
      // Don't fail the request if logging fails
    }

    // Delete the room (cabinets will be deleted automatically due to cascade)
    await prisma.room.delete({
      where: {
        id: roomId
      }
    })

    return NextResponse.json({ message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    )
  }
}
