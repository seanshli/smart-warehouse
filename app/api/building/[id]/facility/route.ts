import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingManagement } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/facility
 * List all facilities for a building
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

    const buildingId = params.id

    // Check if user has access to this building
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        members: {
          where: { userId: (session.user as any).id },
        },
        community: {
          include: {
            members: {
              where: { userId: (session.user as any).id },
            },
          },
        },
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    // Check access
    const hasAccess = building.members.length > 0 || 
                     building.community.members.length > 0 ||
                     (session.user as any).isAdmin

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const facilities = await prisma.facility.findMany({
      where: { 
        buildingId,
        isActive: true,
      },
      include: {
        operatingHours: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ success: true, data: facilities })
  } catch (error) {
    console.error('Error fetching facilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { status: 500 }
    )
  }
}

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
    const buildingId = params.id
    const { name, description, type, floorNumber, capacity } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Facility name is required' }, { status: 400 })
    }

    if (!(await checkBuildingManagement(userId, buildingId))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    let floorId: string | undefined
    if (typeof floorNumber === 'number' && floorNumber > 0) {
      const floor = await prisma.floor.upsert({
        where: {
          buildingId_floorNumber: {
            buildingId,
            floorNumber,
          },
        },
        update: {
          name: floorNumber === 1 ? 'Front Door / 大門' : `Floor ${floorNumber}`,
        },
        create: {
          buildingId,
          floorNumber,
          name: floorNumber === 1 ? 'Front Door / 大門' : `Floor ${floorNumber}`,
          description: floorNumber === 1 ? 'Common area' : 'Facility floor',
          isResidential: floorNumber >= 2,
        },
      })
      floorId = floor.id
    }

    const facility = await prisma.facility.create({
      data: {
        buildingId,
        floorId,
        floorNumber: floorNumber || null,
        name,
        description,
        type,
        capacity: typeof capacity === 'number' ? capacity : null,
        isActive: true,
      },
      include: {
        operatingHours: true,
      },
    })

    // create default operating hours (Mon-Fri 06:00-22:00)
    const defaultHours = [1, 2, 3, 4, 5].map((day) =>
      prisma.facilityOperatingHours.create({
        data: {
          facilityId: facility.id,
          dayOfWeek: day,
          openTime: '06:00',
          closeTime: '22:00',
          isClosed: false,
        },
      })
    )
    await prisma.$transaction(defaultHours)

    const refreshed = await prisma.facility.findUnique({
      where: { id: facility.id },
      include: { operatingHours: true },
    })

    return NextResponse.json(
      { success: true, data: refreshed },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating facility:', error)
    return NextResponse.json(
      { error: 'Failed to create facility' },
      { status: 500 }
    )
  }
}

