import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityPermission, isCommunityMember } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/community/[id]/buildings
 * Get all buildings in a community
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

    const userId = (session.user as any).id
    const communityId = params.id

    // Check if user is a member
    if (!(await isCommunityMember(userId, communityId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const buildings = await prisma.building.findMany({
      where: { communityId },
      include: {
        _count: {
          select: {
            households: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      buildings: buildings.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        address: b.address,
        floorCount: b.floorCount,
        unitCount: b.unitCount,
        latitude: b.latitude,
        longitude: b.longitude,
        householdCount: b._count.households,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching buildings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buildings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/community/[id]/buildings
 * Create a new building in the community
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
    const communityId = params.id
    const body = await request.json()
    const { name, description, address, floorCount, unitCount, latitude, longitude } = body

    if (!name) {
      return NextResponse.json({ error: 'Building name is required' }, { status: 400 })
    }

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    // Super admins can create buildings, otherwise check permission
    if (!user?.isAdmin) {
      if (!(await checkCommunityPermission(userId, communityId, 'canCreateBuildings'))) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    const building = await prisma.building.create({
      data: {
        communityId,
        name,
        description,
        address,
        floorCount,
        unitCount,
        latitude,
        longitude,
      },
      include: {
        _count: {
          select: {
            households: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: building.id,
      name: building.name,
      description: building.description,
      address: building.address,
      floorCount: building.floorCount,
      unitCount: building.unitCount,
      latitude: building.latitude,
      longitude: building.longitude,
      householdCount: building._count.households,
      createdAt: building.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating building:', error)
    return NextResponse.json(
      { error: 'Failed to create building' },
      { status: 500 }
    )
  }
}

