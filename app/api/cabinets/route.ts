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
    const roomId = searchParams.get('roomId')

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: (session?.user as any)?.id
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Build where clause
    const whereClause: any = {
      room: {
        householdId: household.id
      }
    }

    // Filter by room if specified
    if (roomId) {
      whereClause.roomId = roomId
    }

    const cabinets = await prisma.cabinet.findMany({
      where: whereClause,
      include: {
        room: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(cabinets)
  } catch (error) {
    console.error('Error fetching cabinets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cabinets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, roomId } = body

    // Verify the room belongs to user's household
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        household: {
          members: {
            some: {
              userId: (session?.user as any)?.id
            }
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or access denied' },
        { status: 404 }
      )
    }

    const cabinet = await prisma.cabinet.create({
      data: {
        name,
        description,
        roomId
      }
    })

    return NextResponse.json(cabinet)
  } catch (error) {
    console.error('Error creating cabinet:', error)
    return NextResponse.json(
      { error: 'Failed to create cabinet' },
      { status: 500 }
    )
  }
}


