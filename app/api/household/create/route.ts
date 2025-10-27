import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Household name is required' }, { status: 400 })
    }

    // Create the household with the user as the owner
    const household = await prisma.household.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        members: {
          create: {
            userId: userId,
            role: 'OWNER'
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Preload 4 default rooms for the new household
    const defaultRooms = [
      { name: '廚房', description: 'Kitchen', cabinets: ['A', 'B', 'C', 'D'] },
      { name: '主臥室', description: 'Master bedroom', cabinets: ['主櫥櫃'] },
      { name: '兒童房', description: 'Kids room', cabinets: ['兒童衣櫥'] },
      { name: '客廳', description: 'Living room', cabinets: ['客廳櫃'] }
    ]

    // Create rooms and cabinets
    for (const roomData of defaultRooms) {
      const room = await prisma.room.create({
        data: {
          name: roomData.name,
          description: roomData.description,
          householdId: household.id
        }
      })

      // Create cabinets for each room
      for (const cabinetName of roomData.cabinets) {
        await prisma.cabinet.create({
          data: {
            name: cabinetName,
            description: `${cabinetName} cabinet`,
            roomId: room.id
          }
        })
      }
    }

    // Preload 7 default categories
    const defaultCategories = [
      { name: 'accessory', level: 1 },
      { name: 'book', level: 1 },
      { name: 'clothes', level: 1 },
      { name: 'electronics', level: 1 },
      { name: 'kitchenware', level: 1 },
      { name: 'mics', level: 1 },
      { name: 'tools', level: 1 }
    ]

    await prisma.category.createMany({
      data: defaultCategories.map(category => ({
        name: category.name,
        level: category.level,
        householdId: household.id
      }))
    })

    console.log(`✅ Created ${defaultRooms.length} rooms with cabinets and ${defaultCategories.length} categories for household: ${household.name}`)

    return NextResponse.json({
      success: true,
      household: {
        id: household.id,
        name: household.name,
        description: household.description,
        members: household.members
      }
    })
  } catch (error) {
    console.error('Error creating household:', error)
    return NextResponse.json(
      { error: 'Failed to create household' },
      { status: 500 }
    )
  }
}
