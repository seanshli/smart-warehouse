import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingManagement } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/facility/[id]/operating-hours
 * Get operating hours for a facility
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

    const operatingHours = await prisma.facilityOperatingHours.findMany({
      where: { facilityId },
      orderBy: {
        dayOfWeek: 'asc',
      },
    })

    return NextResponse.json({ success: true, data: operatingHours })
  } catch (error) {
    console.error('Error fetching operating hours:', error)
    return NextResponse.json(
      { error: 'Failed to fetch operating hours' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/building/[id]/facility/[id]/operating-hours
 * Update operating hours for a facility (admin only)
 */
export async function PUT(
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
    const { operatingHours } = await request.json() // Array of { dayOfWeek, openTime, closeTime, isClosed }

    if (!Array.isArray(operatingHours)) {
      return NextResponse.json(
        { error: 'Operating hours must be an array' },
        { status: 400 }
      )
    }

    // Find facility
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        building: true,
      },
    })

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    // Check if user has permission to manage this building
    const hasAccess = await checkBuildingManagement(userId, facility.buildingId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update operating hours
    const updated = []
    for (const hours of operatingHours) {
      const updatedHours = await prisma.facilityOperatingHours.upsert({
        where: {
          facilityId_dayOfWeek: {
            facilityId,
            dayOfWeek: hours.dayOfWeek,
          },
        },
        update: {
          openTime: hours.openTime,
          closeTime: hours.closeTime,
          isClosed: hours.isClosed ?? false,
        },
        create: {
          facilityId,
          dayOfWeek: hours.dayOfWeek,
          openTime: hours.openTime,
          closeTime: hours.closeTime,
          isClosed: hours.isClosed ?? false,
        },
      })
      updated.push(updatedHours)
    }

    return NextResponse.json({
      success: true,
      message: 'Operating hours updated successfully',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating operating hours:', error)
    return NextResponse.json(
      { error: 'Failed to update operating hours' },
      { status: 500 }
    )
  }
}

