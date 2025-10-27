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

    // Preload 5 default rooms for the new household
    const defaultRooms = [
      { name: '客廳', description: 'Living room' },
      { name: '主臥室', description: 'Master bedroom' },
      { name: '兒童房', description: 'Kids room' },
      { name: '廚房', description: 'Kitchen' },
      { name: '車庫', description: 'Garage' }
    ]

    await prisma.room.createMany({
      data: defaultRooms.map(room => ({
        name: room.name,
        description: room.description,
        householdId: household.id
      }))
    })

    console.log(`✅ Created ${defaultRooms.length} default rooms for household: ${household.name}`)

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
