import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id

    const { searchParams } = new URL(request.url)
    const requestedHouseholdId = searchParams.get('householdId')

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

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
  }
}


