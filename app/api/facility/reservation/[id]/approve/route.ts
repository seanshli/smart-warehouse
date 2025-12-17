import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/facility/reservation/[id]/approve
 * Approve a facility reservation (building admin only)
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
    const reservationId = params.id
    const body = await request.json().catch(() => ({}))
    const { comment } = body // Admin comment/suggestion

    // Get reservation with facility and building info
    const reservation = await prisma.facilityReservation.findUnique({
      where: { id: reservationId },
      include: {
        facility: {
          include: {
            building: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (reservation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Reservation is not pending' },
        { status: 400 }
      )
    }

    // Check if user is building admin
    const buildingMembership = await prisma.buildingMember.findUnique({
      where: {
        userId_buildingId: {
          userId,
          buildingId: reservation.facility.building.id,
        },
      },
    })

    if (!buildingMembership || (buildingMembership.role !== 'ADMIN' && buildingMembership.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Only building admins can approve reservations' },
        { status: 403 }
      )
    }

    // Check if time slot is still available (no conflicts)
    // Also check capacity if facility has capacity limit
    const conflicting = await prisma.facilityReservation.findMany({
      where: {
        facilityId: reservation.facilityId,
        id: { not: reservationId },
        status: {
          in: ['pending', 'approved'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: reservation.startTime } },
              { endTime: { gt: reservation.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: reservation.endTime } },
              { endTime: { gte: reservation.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: reservation.startTime } },
              { endTime: { lte: reservation.endTime } },
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

    if (conflicting.length > 0) {
      // Check capacity if facility has capacity
      const facility = await prisma.facility.findUnique({
        where: { id: reservation.facilityId },
        select: { capacity: true },
      })

      if (facility?.capacity && facility.capacity > 0) {
        const totalPeopleInConflicts = conflicting.reduce((sum, r) => sum + (r.numberOfPeople || 1), 0)
        const reservationPeople = reservation.numberOfPeople || 1
        const totalPeople = totalPeopleInConflicts + reservationPeople

        if (totalPeople > facility.capacity) {
          return NextResponse.json(
            { 
              error: 'Time slot capacity exceeded. Cannot approve reservation.',
              conflict: {
                totalPeople: totalPeopleInConflicts,
                capacity: facility.capacity,
                reservationPeople: reservationPeople,
                conflictingReservations: conflicting.map(r => ({
                  household: r.household.name || r.household.apartmentNo,
                  apartmentNo: r.household.apartmentNo,
                  startTime: r.startTime,
                  endTime: r.endTime,
                  numberOfPeople: r.numberOfPeople || 1,
                })),
              },
            },
            { status: 400 }
          )
        }
      }

      // Time conflict exists
      return NextResponse.json(
        { 
          error: 'Time slot is no longer available. Another reservation was approved first.',
          conflict: {
            conflictingReservations: conflicting.map(r => ({
              household: r.household.name || r.household.apartmentNo,
              apartmentNo: r.household.apartmentNo,
              startTime: r.startTime,
              endTime: r.endTime,
              numberOfPeople: r.numberOfPeople || 1,
            })),
          },
        },
        { status: 400 }
      )
    }

    // Generate access code
    const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    // Approve reservation
    const approved = await prisma.facilityReservation.update({
      where: { id: reservationId },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        accessCode,
        notes: comment 
          ? `${reservation.notes || ''}\n[Admin Comment] ${comment}`.trim()
          : reservation.notes,
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

    // Create notifications for household members
    const notifications = approved.household.members.map(member => ({
      userId: member.userId,
      facilityReservationId: approved.id,
      type: 'facility_reservation_approved',
      title: 'Reservation Approved',
      message: `Your reservation for ${approved.facility.name} has been approved. Access code: ${accessCode}`,
    }))

    await prisma.notification.createMany({
      data: notifications,
    })

    return NextResponse.json({
      success: true,
      message: 'Reservation approved successfully',
      data: approved,
    })
  } catch (error) {
    console.error('Error approving reservation:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        error: 'Failed to approve reservation',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorDetails })
      },
      { status: 500 }
    )
  }
}


