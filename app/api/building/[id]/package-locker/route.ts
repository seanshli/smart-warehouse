import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingManagement } from '@/lib/middleware/community-permissions'
import { syncFrontDoorFeatures } from '@/lib/building/front-door'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/package-locker
 * List all package lockers for a building
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

    const lockers = await prisma.packageLocker.findMany({
      where: { buildingId },
      include: {
        packages: {
          where: {
            status: 'pending',
          },
          include: {
            household: {
              select: {
                id: true,
                name: true,
                apartmentNo: true,
              },
            },
          },
          orderBy: {
            checkedInAt: 'desc',
          },
        },
      },
      orderBy: {
        lockerNumber: 'asc',
      },
    })

    return NextResponse.json({ success: true, data: lockers })
  } catch (error) {
    console.error('Error fetching package lockers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch package lockers' },
      { status: 500 }
    )
  }
}

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
    const buildingId = params.id
    const { count } = await request.json()

    if (typeof count !== 'number' || count < 0 || count > 100) {
      return NextResponse.json(
        { error: 'count must be a number between 0 and 100' },
        { status: 400 }
      )
    }

    if (!(await checkBuildingManagement(userId, buildingId))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const result = await syncFrontDoorFeatures(buildingId, { packageLockerCount: count })

    return NextResponse.json({
      success: true,
      message: 'Package locker count updated',
      data: result,
    })
  } catch (error) {
    console.error('Error updating package lockers:', error)
    return NextResponse.json(
      { error: 'Failed to update package lockers' },
      { status: 500 }
    )
  }
}

