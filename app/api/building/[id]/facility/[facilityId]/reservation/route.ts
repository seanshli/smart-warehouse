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
    const { householdId, startTime, endTime, timezoneOffset, purpose, notes, numberOfPeople } = await request.json()

    if (!householdId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Household ID, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Validate times
    // CRITICAL FIX: The client sends ISO string which is UTC time
    // Example: User selects 13:00 local (UTC+8), client sends "2025-12-16T05:00:00.000Z" (UTC)
    // We need to convert back to local time for operating hours check
    const startISO = new Date(startTime)
    const endISO = new Date(endTime)
    
    if (isNaN(startISO.getTime()) || isNaN(endISO.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }
    
    // Convert UTC time back to client's local time
    // timezoneOffset is in minutes (positive for UTC+, negative for UTC-)
    // Example: UTC+8 = +480 minutes
    const clientTimezoneOffsetMs = (timezoneOffset || 0) * 60 * 1000
    const start = new Date(startISO.getTime() + clientTimezoneOffsetMs)
    const end = new Date(endISO.getTime() + clientTimezoneOffsetMs)

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

    // Find facility with capacity info
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

    // Check for overlapping reservations (approved or pending)
    const overlappingReservations = await prisma.facilityReservation.findMany({
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
      include: {
        household: {
          select: {
            name: true,
            apartmentNo: true,
          },
        },
      },
    })

    // If facility has a capacity, check if total people exceeds capacity
    if (facility.capacity && facility.capacity > 0) {
      // Sum up people from all overlapping reservations
      const totalPeopleInOverlapping = overlappingReservations.reduce((sum, res) => {
        return sum + (res.numberOfPeople || 1) // Default to 1 if numberOfPeople is null
      }, 0)
      
      // Add the new reservation's people count
      const newReservationPeople = numberOfPeople ? parseInt(numberOfPeople) : 1
      const totalPeople = totalPeopleInOverlapping + newReservationPeople
      
      if (totalPeople > facility.capacity) {
        // Automatically create reservation with rejected status
        const rejectionReason = `Facility capacity exceeded. Current reservations: ${totalPeopleInOverlapping}/${facility.capacity}, adding ${newReservationPeople} would exceed capacity.`
        const rejectedReservation = await prisma.facilityReservation.create({
          data: {
            facilityId,
            householdId,
            requestedBy: userId,
            startTime: start,
            endTime: end,
            purpose: purpose || null,
            notes: notes ? `${notes}\n[Auto-rejected] ${rejectionReason}` : `[Auto-rejected] ${rejectionReason}`,
            numberOfPeople: numberOfPeople ? parseInt(numberOfPeople) : null,
            status: 'rejected',
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
        
        return NextResponse.json(
          { 
            success: false,
            error: rejectionReason,
            errorCode: 'CAPACITY_EXCEEDED',
            reservation: rejectedReservation,
            conflict: {
              totalPeople: totalPeopleInOverlapping,
              capacity: facility.capacity,
              newReservationPeople: newReservationPeople,
            },
          },
          { status: 409 } // 409 Conflict status code
        )
      }
      // If capacity allows, proceed with creating the reservation
    } else {
      // If no capacity is set, block overlaps (for exclusive facilities like meeting rooms)
      if (overlappingReservations.length > 0) {
        const firstOverlapping = overlappingReservations[0]
        
        // Automatically create reservation with rejected status
        const rejectionReason = `Time slot occupied by ${firstOverlapping.household.name || firstOverlapping.household.apartmentNo}`
        const rejectedReservation = await prisma.facilityReservation.create({
          data: {
            facilityId,
            householdId,
            requestedBy: userId,
            startTime: start,
            endTime: end,
            purpose: purpose || null,
            notes: notes ? `${notes}\n[Auto-rejected] ${rejectionReason}` : `[Auto-rejected] ${rejectionReason}`,
            numberOfPeople: numberOfPeople ? parseInt(numberOfPeople) : null,
            status: 'rejected',
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

        return NextResponse.json(
          { 
            success: false,
            error: 'Time slot is already occupied',
            errorCode: 'TIME_OCCUPIED',
            reservation: rejectedReservation,
            conflict: {
              household: firstOverlapping.household.name || firstOverlapping.household.apartmentNo,
              startTime: firstOverlapping.startTime,
              endTime: firstOverlapping.endTime,
            },
          },
          { status: 409 } // 409 Conflict status code
        )
      }
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
      
      // CRITICAL FIX: Extract LOCAL time components from Date objects
      // The Date objects now represent local time (after timezone conversion above)
      // Extract hours and minutes directly
      const finalStartHour = start.getHours()
      const finalStartMinute = start.getMinutes()
      const finalEndHour = end.getHours()
      const finalEndMinute = end.getMinutes()
      
      // Convert to minutes for easier comparison
      const openTimeMinutes = openHour * 60 + openMinute
      const closeTimeMinutes = closeHour * 60 + closeMinute
      const reservationStartMinutes = finalStartHour * 60 + finalStartMinute
      const reservationEndMinutes = finalEndHour * 60 + finalEndMinute
      
      // Debug logging
      console.log('[Reservation Operating Hours Check]', {
        operatingHours: `${operatingHours.openTime} - ${operatingHours.closeTime}`,
        openTimeMinutes,
        closeTimeMinutes,
        reservationStart: `${String(finalStartHour).padStart(2, '0')}:${String(finalStartMinute).padStart(2, '0')}`,
        reservationEnd: `${String(finalEndHour).padStart(2, '0')}:${String(finalEndMinute).padStart(2, '0')}`,
        reservationStartMinutes,
        reservationEndMinutes,
        timezoneOffsetMinutes: start.getTimezoneOffset(),
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        startLocal: start.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }),
        endLocal: end.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }),
      })
      
      // Check if reservation is within operating hours
      // Allow reservations that start at or after open time and end at or before close time
      if (reservationStartMinutes < openTimeMinutes || reservationEndMinutes > closeTimeMinutes) {
        console.log('[Reservation Operating Hours Check] FAILED', {
          reason: reservationStartMinutes < openTimeMinutes 
            ? `Start time ${reservationStartMinutes} (${String(finalStartHour).padStart(2, '0')}:${String(finalStartMinute).padStart(2, '0')}) is before open time ${openTimeMinutes} (${operatingHours.openTime})`
            : `End time ${reservationEndMinutes} (${String(finalEndHour).padStart(2, '0')}:${String(finalEndMinute).padStart(2, '0')}) is after close time ${closeTimeMinutes} (${operatingHours.closeTime})`,
        })
        return NextResponse.json(
          { 
            error: `Reservation must be within operating hours (${operatingHours.openTime} - ${operatingHours.closeTime})`,
            details: {
              requestedStart: `${String(finalStartHour).padStart(2, '0')}:${String(finalStartMinute).padStart(2, '0')}`,
              requestedEnd: `${String(finalEndHour).padStart(2, '0')}:${String(finalEndMinute).padStart(2, '0')}`,
              operatingHours: `${operatingHours.openTime} - ${operatingHours.closeTime}`,
            },
            suggestedTimes: {
              earliest: operatingHours.openTime,
              latest: operatingHours.closeTime,
            }
          },
          { status: 400 }
        )
      }
      
      console.log('[Reservation Operating Hours Check] PASSED')
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
        numberOfPeople: numberOfPeople ? parseInt(numberOfPeople) : null,
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

