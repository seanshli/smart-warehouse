import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingManagement } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/building/[id]/facility-reservation/[id]/reject
 * Reject a facility reservation (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; reservationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const reservationId = params.reservationId
    const { reason } = await request.json()

    // Find reservation
    const reservation = await prisma.facilityReservation.findUnique({
      where: { id: reservationId },
      include: {
        facility: {
          include: {
            building: true,
          },
        },
        household: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Check if user has permission to manage this building
    const hasAccess = await checkBuildingManagement(userId, reservation.facility.buildingId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (reservation.status !== 'pending') {
      return NextResponse.json(
        { error: `Reservation is already ${reservation.status}` },
        { status: 400 }
      )
    }

    // Update reservation
    const updated = await prisma.facilityReservation.update({
      where: { id: reservationId },
      data: {
        status: 'rejected',
        approvedBy: userId,
        approvedAt: new Date(),
        notes: reason ? `${reservation.notes || ''}\nRejection reason: ${reason}`.trim() : reservation.notes,
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

    // Create notifications for all household members
    const notifications = []
    for (const member of reservation.household.members) {
      const notification = await prisma.notification.create({
        data: {
          type: 'FACILITY_RESERVATION_REJECTED',
          title: 'Reservation Rejected',
          message: `Your reservation for ${reservation.facility.name} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
          userId: member.user.id,
          facilityReservationId: reservation.id,
        },
      })
      notifications.push(notification)
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation rejected successfully',
      data: {
        ...updated,
        notificationsSent: notifications.length,
      },
    })
  } catch (error) {
    console.error('Error rejecting reservation:', error)
    return NextResponse.json(
      { error: 'Failed to reject reservation' },
      { status: 500 }
    )
  }
}

