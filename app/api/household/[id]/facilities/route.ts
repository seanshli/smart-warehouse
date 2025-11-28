import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/household/[id]/facilities
 * Get all available facilities from the building that the household belongs to
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const householdId = params.id

    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this household' }, { status: 403 })
    }

    // Get household with building info
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: {
        id: true,
        buildingId: true,
      },
    })

    if (!household || !household.buildingId) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'Household does not belong to a building'
      })
    }

    // Get all active facilities for this building
    const facilities = await prisma.facility.findMany({
      where: {
        buildingId: household.buildingId,
        isActive: true,
      },
      include: {
        operatingHours: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: [
        { floorNumber: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: facilities.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        type: f.type,
        floorNumber: f.floorNumber,
        capacity: f.capacity,
        operatingHours: f.operatingHours,
        reservationCount: f._count.reservations,
      })),
    })
  } catch (error) {
    console.error('Error fetching facilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { status: 500 }
    )
  }
}

