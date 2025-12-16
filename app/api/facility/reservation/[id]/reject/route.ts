import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/facility/reservation/[id]/reject
 * Reject a facility reservation (building admin only)
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
    const { reason } = body

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
        { error: 'Only building admins can reject reservations' },
        { status: 403 }
      )
    }

    // Reject reservation
    const rejected = await prisma.facilityReservation.update({
      where: { id: reservationId },
      data: {
        status: 'rejected',
        approvedBy: userId,
        approvedAt: new Date(),
        notes: reason 
          ? `${reservation.notes || ''}\n[Admin Rejection Reason] ${reason}`.trim()
          : reservation.notes,
      },
    })

    // Create notifications for household members
    const notifications = reservation.household.members.map(member => ({
      userId: member.userId,
      facilityReservationId: rejected.id,
      type: 'facility_reservation_rejected',
      title: 'Reservation Rejected',
      message: `Your reservation for ${reservation.facility.name} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
    }))

    await prisma.notification.createMany({
      data: notifications,
    })

    return NextResponse.json({
      success: true,
      message: 'Reservation rejected',
      data: rejected,
    })
  } catch (error) {
    console.error('Error rejecting reservation:', error)
    return NextResponse.json(
      { error: 'Failed to reject reservation' },
      { status: 500 }
    )
  }
}


