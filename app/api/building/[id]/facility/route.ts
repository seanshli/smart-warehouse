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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle both sync and async params (Next.js 13+ compatibility)
    const resolvedParams = await Promise.resolve(params)
    const buildingId = resolvedParams.id

    if (!buildingId || typeof buildingId !== 'string') {
      return NextResponse.json({ error: 'Invalid building ID' }, { status: 400 })
    }

    // Check if building exists and user has access
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: {
        id: true,
        communityId: true,
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    // Check access - simplified to avoid nested query issues
    const userId = (session.user as any).id
    const isAdmin = (session.user as any).isAdmin

    if (!isAdmin) {
      // Check if user is building member
      const buildingMember = await prisma.buildingMember.findUnique({
        where: {
          userId_buildingId: {
            userId,
            buildingId,
          },
        },
      })

      // Check if user is community member
      const communityMember = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId: building.communityId,
          },
        },
      })

      if (!buildingMember && !communityMember) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Fetch facilities - include both active and inactive for admin view
    // Filter can be applied on frontend if needed
    const facilities = await prisma.facility.findMany({
      where: { 
        buildingId,
        // Remove isActive filter to show all facilities
        // Admin should see all facilities to manage them
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

    console.log(`[Facility API] Found ${facilities.length} facilities for building ${buildingId}`)
    if (facilities.length > 0) {
      console.log(`[Facility API] Facility names:`, facilities.map(f => f.name))
    }
    return NextResponse.json({ success: true, data: facilities })
  } catch (error: any) {
    console.error('Error fetching facilities:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch facilities',
        details: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const resolvedParams = await Promise.resolve(params)
    const buildingId = resolvedParams.id

    if (!buildingId || typeof buildingId !== 'string') {
      return NextResponse.json({ error: 'Invalid building ID' }, { status: 400 })
    }
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

