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
    const userId = (session?.user as any)?.id
    
    console.log('[cabinets] GET /api/warehouse/cabinets - roomId:', roomId, 'userId:', userId)

    // If roomId is specified, verify it belongs to a household the user has access to
    // This ensures we're getting cabinets from the correct household when user has multiple households
    if (roomId) {
      const room = await prisma.room.findFirst({
        where: {
          id: roomId,
          household: {
            members: {
              some: {
                userId: userId
              }
            }
          }
        },
        include: {
          household: true
        }
      })

      if (!room) {
        console.log('[cabinets] GET /api/warehouse/cabinets - Room not found or access denied:', roomId)
        return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 })
      }

      // Fetch cabinets for this specific room (which implicitly ensures correct household)
      const cabinets = await prisma.cabinet.findMany({
        where: {
          roomId: roomId
        },
        include: {
          room: true
        },
        orderBy: {
          name: 'asc'
        }
      })

      console.log('[cabinets] GET /api/warehouse/cabinets - Found cabinets:', cabinets.length, 'for roomId:', roomId, 'householdId:', room.householdId)
      return NextResponse.json(cabinets)
    }

    // No roomId specified - get all cabinets from all households user has access to
    const households = await prisma.household.findMany({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      select: {
        id: true
      }
    })

    const householdIds = households.map(h => h.id)

    const cabinets = await prisma.cabinet.findMany({
      where: {
        room: {
          householdId: {
            in: householdIds
          }
        }
      },
      include: {
        room: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('[cabinets] GET /api/warehouse/cabinets - Found cabinets:', cabinets.length, 'across', householdIds.length, 'households')
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


