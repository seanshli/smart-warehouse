import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/facility/[id]/reservation
 * Create a facility reservation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; facilityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const facilityId = params.facilityId
    const { householdId, startTime, endTime, purpose, notes } = await request.json()

    if (!householdId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Household ID, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Validate times
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: 'Start time must be in the future' },
        { status: 400 }
      )
    }

    // Find facility
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        building: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    // Check if user is a member of the household
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: {
          where: { userId },
        },
      },
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    if (household.members.length === 0) {
      return NextResponse.json(
        { error: 'You must be a member of the household to make a reservation' },
        { status: 403 }
      )
    }

    // Check for overlapping reservations
    const overlapping = await prisma.facilityReservation.findFirst({
      where: {
        facilityId,
        status: {
          in: ['pending', 'approved'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } },
            ],
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } },
            ],
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } },
            ],
          },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json(
        { error: 'Time slot is already reserved' },
        { status: 400 }
      )
    }

    // Check operating hours
    const dayOfWeek = start.getDay()
    const operatingHours = await prisma.facilityOperatingHours.findUnique({
      where: {
        facilityId_dayOfWeek: {
          facilityId,
          dayOfWeek,
        },
      },
    })

    if (operatingHours?.isClosed) {
      return NextResponse.json(
        { error: 'Facility is closed on this day' },
        { status: 400 }
      )
    }

    if (operatingHours) {
      const [openHour, openMinute] = operatingHours.openTime.split(':').map(Number)
      const [closeHour, closeMinute] = operatingHours.closeTime.split(':').map(Number)
      const openTime = new Date(start)
      openTime.setHours(openHour, openMinute, 0, 0)
      const closeTime = new Date(start)
      closeTime.setHours(closeHour, closeMinute, 0, 0)

      if (start < openTime || end > closeTime) {
        return NextResponse.json(
          { error: `Reservation must be within operating hours (${operatingHours.openTime} - ${operatingHours.closeTime})` },
          { status: 400 }
        )
      }
    }

    // Create reservation
    const reservation = await prisma.facilityReservation.create({
      data: {
        facilityId,
        householdId,
        requestedBy: userId,
        startTime: start,
        endTime: end,
        purpose: purpose || null,
        notes: notes || null,
        status: 'pending',
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      data: reservation,
    })
  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/building/[id]/facility/[id]/reservation
 * List reservations for a facility
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; facilityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const facilityId = params.facilityId
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const householdId = searchParams.get('householdId')

    const where: any = { facilityId }
    if (status) {
      where.status = status
    }
    if (householdId) {
      where.householdId = householdId
    }

    const reservations = await prisma.facilityReservation.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    return NextResponse.json({ success: true, data: reservations })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}

