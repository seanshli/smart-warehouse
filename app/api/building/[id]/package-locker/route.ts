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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const buildingId = resolvedParams.id

    // Check if user has access to this building
    // Use select instead of include to avoid implicit memberClass queries
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: {
        id: true,
        members: {
          where: { userId: (session.user as any).id },
          select: {
            id: true,
            userId: true,
            buildingId: true,
          },
        },
        community: {
          select: {
            id: true,
            members: {
              where: { userId: (session.user as any).id },
              select: {
                id: true,
                userId: true,
                communityId: true,
              },
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

    // Map lockers to include isOccupied field
    const lockersWithStatus = lockers.map(locker => ({
      ...locker,
      isOccupied: locker.packages.length > 0,
    }))

    return NextResponse.json({ success: true, data: lockersWithStatus })
  } catch (error: any) {
    console.error('Error fetching package lockers:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error?.code || 'UNKNOWN'
    
    // Log Prisma-specific errors
    if (error?.code) {
      console.error('Prisma error code:', error.code)
      console.error('Prisma error meta:', error.meta)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch package lockers',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const buildingId = resolvedParams.id
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

