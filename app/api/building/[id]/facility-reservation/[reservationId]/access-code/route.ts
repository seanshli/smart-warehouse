import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/facility-reservation/[id]/access-code
 * Get access code for an approved reservation
 */
export async function GET(
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
              where: { userId },
            },
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Check if user is a member of the household or building admin
    const isHouseholdMember = reservation.household.members.length > 0
    
    const building = await prisma.building.findUnique({
      where: { id: reservation.facility.buildingId },
      include: {
        members: {
          where: { userId },
        },
      },
    })

    const isBuildingAdmin = building?.members.some(m => m.role === 'ADMIN' || m.role === 'MANAGER') || false
    const isSystemAdmin = (session.user as any).isAdmin

    if (!isHouseholdMember && !isBuildingAdmin && !isSystemAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (reservation.status !== 'approved') {
      return NextResponse.json(
        { error: 'Reservation is not approved' },
        { status: 400 }
      )
    }

    if (!reservation.accessCode) {
      return NextResponse.json(
        { error: 'Access code not generated yet' },
        { status: 400 }
      )
    }

    // Check if reservation time has arrived
    const now = new Date()
    const startTime = new Date(reservation.startTime)
    const endTime = new Date(reservation.endTime)

    if (now < startTime) {
      return NextResponse.json({
        success: true,
        message: 'Reservation has not started yet',
        data: {
          accessCode: null,
          availableAt: startTime,
          expiresAt: endTime,
        },
      })
    }

    if (now > endTime) {
      return NextResponse.json({
        success: true,
        message: 'Reservation has expired',
        data: {
          accessCode: null,
          expired: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        accessCode: reservation.accessCode,
        availableAt: startTime,
        expiresAt: endTime,
      },
    })
  } catch (error) {
    console.error('Error fetching access code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch access code' },
      { status: 500 }
    )
  }
}

