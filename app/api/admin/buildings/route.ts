import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/buildings
 * Get all buildings (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')

    // Get all buildings
    const buildings = await prisma.building.findMany({
      where: communityId ? { communityId } : undefined,
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
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
        community: b.community,
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

