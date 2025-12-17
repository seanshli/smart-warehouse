import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/facility/[id]/reservations
 * Get reservations for a facility with availability checking
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

    const facilityId = params.id
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includePending = searchParams.get('includePending') === 'true'

    const where: any = { facilityId }
    
    if (startDate && endDate) {
      where.OR = [
        {
          AND: [
            { startTime: { gte: new Date(startDate) } },
            { startTime: { lte: new Date(endDate) } },
          ],
        },
        {
          AND: [
            { endTime: { gte: new Date(startDate) } },
            { endTime: { lte: new Date(endDate) } },
          ],
        },
        {
          AND: [
            { startTime: { lte: new Date(startDate) } },
            { endTime: { gte: new Date(endDate) } },
          ],
        },
      ]
    }

    if (!includePending) {
      where.status = {
        in: ['approved', 'completed'],
      }
    } else {
      where.status = {
        in: ['pending', 'approved', 'completed'],
      }
    }

    const reservations = await prisma.facilityReservation.findMany({
      where,
      include: {
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: reservations,
    })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/facility/[id]/reservations
 * Create a new reservation (checks availability first)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const facilityId = params.id
    const { householdId, startTime, endTime, timezoneOffset, purpose, notes, numberOfPeople } = await request.json()

    if (!householdId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Household ID, start time, and end time are required' },
        { status: 400 }
      )
    }

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
      return NextResponse.json(
        { error: 'You must be a member of the household to make a reservation' },
        { status: 403 }
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

    // Get facility with building info
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        building: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    // Verify household belongs to the same building
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: {
        id: true,
        buildingId: true,
      },
    })

    if (!household || household.buildingId !== facility.buildingId) {
      return NextResponse.json(
        { error: 'Household does not belong to the same building as the facility' },
        { status: 403 }
      )
    }

    // Check operating hours
    // CRITICAL FIX: Extract day of week from the ISO string date part, not server's local time
    // The ISO string format is: YYYY-MM-DDTHH:MM:SS.sssZ
    // We need the date part (YYYY-MM-DD) to determine day of week correctly
    const startISO = start.toISOString()
    const dateMatch = startISO.match(/^(\d{4})-(\d{2})-(\d{2})/)
    let dayOfWeek: number
    
    if (dateMatch) {
      // Create a date object from the date string (YYYY-MM-DD) in UTC
      // This ensures we get the correct day regardless of server timezone
      const year = parseInt(dateMatch[1], 10)
      const month = parseInt(dateMatch[2], 10) - 1 // Month is 0-indexed
      const day = parseInt(dateMatch[3], 10)
      const dateForDayOfWeek = new Date(Date.UTC(year, month, day))
      dayOfWeek = dateForDayOfWeek.getUTCDay()
    } else {
      // Fallback to server's local time (less reliable)
      dayOfWeek = start.getDay()
    }
    
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
        { 
          error: 'Facility is closed on this day',
          details: `The facility is closed on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}. Please select a different day.`
        },
        { status: 400 }
      )
    }

    if (operatingHours) {
      const [openHour, openMinute] = operatingHours.openTime.split(':').map(Number)
      const [closeHour, closeMinute] = operatingHours.closeTime.split(':').map(Number)
      
      // CRITICAL FIX: Convert UTC time back to client's local time
      // The client sends ISO string (UTC) and timezone offset
      // Example: User selects 13:00 local (UTC+8), client sends "2025-12-16T05:00:00.000Z" (UTC) and timezoneOffset: 480
      // We need to convert back to local time for operating hours check
      const clientTimezoneOffsetMs = (timezoneOffset || 0) * 60 * 1000 // Convert minutes to milliseconds
      const startLocal = new Date(start.getTime() + clientTimezoneOffsetMs)
      const endLocal = new Date(end.getTime() + clientTimezoneOffsetMs)
      
      // Extract local time components
      const reservationStartHour = startLocal.getUTCHours()
      const reservationStartMinute = startLocal.getUTCMinutes()
      const reservationEndHour = endLocal.getUTCHours()
      const reservationEndMinute = endLocal.getUTCMinutes()
      
      // Convert to minutes for easier comparison
      const openTimeMinutes = openHour * 60 + openMinute
      const closeTimeMinutes = closeHour * 60 + closeMinute
      const reservationStartMinutes = reservationStartHour * 60 + reservationStartMinute
      const reservationEndMinutes = reservationEndHour * 60 + reservationEndMinute
      
      // Debug logging
      console.log('[Reservation Operating Hours Check]', {
        dayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        operatingHours: `${operatingHours.openTime} - ${operatingHours.closeTime}`,
        openTimeMinutes,
        closeTimeMinutes,
        reservationStart: `${String(reservationStartHour).padStart(2, '0')}:${String(reservationStartMinute).padStart(2, '0')}`,
        reservationEnd: `${String(reservationEndHour).padStart(2, '0')}:${String(reservationEndMinute).padStart(2, '0')}`,
        reservationStartMinutes,
        reservationEndMinutes,
        clientTimezoneOffset: timezoneOffset,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        startLocal: startLocal.toISOString(),
        endLocal: endLocal.toISOString(),
      })
      
      // Check if reservation is within operating hours
      // Allow reservations that start at or after open time and end at or before close time
      if (reservationStartMinutes < openTimeMinutes || reservationEndMinutes > closeTimeMinutes) {
        const reason = reservationStartMinutes < openTimeMinutes 
          ? `Start time ${String(reservationStartHour).padStart(2, '0')}:${String(reservationStartMinute).padStart(2, '0')} is before open time ${operatingHours.openTime}`
          : `End time ${String(reservationEndHour).padStart(2, '0')}:${String(reservationEndMinute).padStart(2, '0')} is after close time ${operatingHours.closeTime}`
        
        console.log('[Reservation Operating Hours Check] FAILED', { reason })
        
        return NextResponse.json(
          { 
            error: `Reservation must be within operating hours (${operatingHours.openTime} - ${operatingHours.closeTime})`,
            details: `Requested: ${String(reservationStartHour).padStart(2, '0')}:${String(reservationStartMinute).padStart(2, '0')} - ${String(reservationEndHour).padStart(2, '0')}:${String(reservationEndMinute).padStart(2, '0')}, Operating: ${operatingHours.openTime} - ${operatingHours.closeTime}. ${reason}`,
            requestedStart: `${String(reservationStartHour).padStart(2, '0')}:${String(reservationStartMinute).padStart(2, '0')}`,
            requestedEnd: `${String(reservationEndHour).padStart(2, '0')}:${String(reservationEndMinute).padStart(2, '0')}`,
            operatingHours: `${operatingHours.openTime} - ${operatingHours.closeTime}`,
          },
          { status: 400 }
        )
      }
      
      console.log('[Reservation Operating Hours Check] PASSED')
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
      orderBy: {
        startTime: 'asc',
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

        // Find next available slot
        const lastOverlapping = overlappingReservations.sort((a, b) => 
          new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
        )[0]
        
        const nextAvailable = await prisma.facilityReservation.findFirst({
          where: {
            facilityId,
            status: {
              in: ['pending', 'approved'],
            },
            startTime: {
              gt: lastOverlapping.endTime,
            },
          },
          orderBy: {
            startTime: 'asc',
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
              overlappingReservations: overlappingReservations.map(r => ({
                household: r.household.name || r.household.apartmentNo,
                apartmentNo: r.household.apartmentNo,
                startTime: r.startTime,
                endTime: r.endTime,
                numberOfPeople: r.numberOfPeople || 1,
              })),
            },
            nextAvailable: nextAvailable ? {
              startTime: nextAvailable.startTime,
              endTime: nextAvailable.endTime,
            } : null,
            allowFrontDeskMessage: true, // Allow messaging front desk for conflicts
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

        // Find next available slot
        const lastOverlapping = overlappingReservations.sort((a, b) => 
          new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
        )[0]
        
        const nextAvailable = await prisma.facilityReservation.findFirst({
          where: {
            facilityId,
            status: {
              in: ['pending', 'approved'],
            },
            startTime: {
              gt: lastOverlapping.endTime,
            },
          },
          orderBy: {
            startTime: 'asc',
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
              apartmentNo: firstOverlapping.household.apartmentNo,
              startTime: firstOverlapping.startTime,
              endTime: firstOverlapping.endTime,
              numberOfPeople: firstOverlapping.numberOfPeople || 1,
              overlappingReservations: overlappingReservations.map(r => ({
                household: r.household.name || r.household.apartmentNo,
                apartmentNo: r.household.apartmentNo,
                startTime: r.startTime,
                endTime: r.endTime,
                numberOfPeople: r.numberOfPeople || 1,
              })),
            },
            nextAvailable: nextAvailable ? {
              startTime: nextAvailable.startTime,
              endTime: nextAvailable.endTime,
            } : null,
            allowFrontDeskMessage: true, // Allow messaging front desk for conflicts
          },
          { status: 409 } // 409 Conflict status code
        )
      }
    }

    // Check if time slot is available (no conflicts) AND capacity allows
    // If available and capacity allows, auto-approve; otherwise create as pending for admin review
    const hasTimeConflicts = overlappingReservations.length > 0
    
    // Check capacity if facility has capacity limit and there are overlapping reservations
    let hasCapacityIssue = false
    if (facility.capacity && facility.capacity > 0 && hasTimeConflicts) {
      const totalPeopleInOverlapping = overlappingReservations.reduce((sum, res) => {
        return sum + (res.numberOfPeople || 1)
      }, 0)
      const newReservationPeople = numberOfPeople ? parseInt(numberOfPeople) : 1
      const totalPeople = totalPeopleInOverlapping + newReservationPeople
      hasCapacityIssue = totalPeople > facility.capacity
    }
    
    // Auto-approve only if no time conflicts AND (no capacity limit OR capacity allows)
    const canAutoApprove = !hasTimeConflicts && !hasCapacityIssue
    
    // Generate access code for approved reservations
    const accessCode = canAutoApprove ? Math.random().toString(36).substring(2, 10).toUpperCase() : null
    
    // Create reservation (auto-approve if available, otherwise pending)
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
        status: canAutoApprove ? 'approved' : 'pending', // Auto-approve if no conflicts and capacity allows
        accessCode: accessCode,
        approvedBy: canAutoApprove ? userId : null, // Auto-approved by requester if no conflicts
        approvedAt: canAutoApprove ? new Date() : null,
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
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    })

    // If auto-approved, create notifications for household members
    if (!hasTimeConflicts && !hasCapacityIssue && reservation.status === 'approved' && reservation.household.members && reservation.household.members.length > 0) {
      try {
        const notifications = reservation.household.members.map(member => ({
          userId: member.userId,
          facilityReservationId: reservation.id,
          type: 'facility_reservation_approved',
          title: 'Reservation Approved',
          message: `Your reservation for ${reservation.facility.name} has been automatically approved. Access code: ${accessCode}`,
        }))

        await prisma.notification.createMany({
          data: notifications,
        })
      } catch (notifError) {
        // Log notification error but don't fail the reservation creation
        console.error('Error creating notifications:', notifError)
      }
    }

    return NextResponse.json({
      success: true,
      message: canAutoApprove
        ? 'Reservation automatically approved. Access code: ' + accessCode
        : 'Reservation request created. Waiting for building admin approval due to potential conflicts.',
      data: reservation,
      autoApproved: canAutoApprove,
    })
  } catch (error: any) {
    console.error('Error creating reservation:', error)
    
    // Provide detailed error information
    let errorMessage = 'Failed to create reservation'
    let errorDetails = null
    
    if (error?.code === 'P2002') {
      errorMessage = 'Duplicate reservation detected'
      errorDetails = error.meta?.target
    } else if (error?.code === 'P2003') {
      errorMessage = 'Invalid reference (facility or household not found)'
      errorDetails = error.meta?.field_name
    } else if (error?.code === 'P2025') {
      errorMessage = 'Record not found'
      errorDetails = error.meta?.cause
    } else if (error?.message) {
      errorMessage = error.message
      errorDetails = error.stack
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        errorCode: error?.code || 'UNKNOWN_ERROR',
        fullError: process.env.NODE_ENV === 'development' ? error?.toString() : undefined,
      },
      { status: 500 }
    )
  }
}


