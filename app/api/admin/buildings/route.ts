import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCommunityMember } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/buildings
 * Get buildings where user has access
 * - Super admin (isAdmin=true): can see all buildings
 * - Community admin (ADMIN/MANAGER role): can only see buildings in their communities
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')

    let buildings

    if (user.isAdmin) {
      // Super admin: can see all buildings
      buildings = await prisma.building.findMany({
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
    } else {
      // Community admin: only see buildings in communities where they are ADMIN or MANAGER
      const memberships = await prisma.communityMember.findMany({
        where: {
          userId,
          role: {
            in: ['ADMIN', 'MANAGER']
          },
          ...(communityId ? { communityId } : {})
        },
        select: {
          communityId: true,
        },
      })

      const accessibleCommunityIds = memberships.map(m => m.communityId)

      if (accessibleCommunityIds.length === 0) {
        // User is not an admin/manager of any community
        return NextResponse.json({ buildings: [] })
      }

      buildings = await prisma.building.findMany({
        where: {
          communityId: {
            in: accessibleCommunityIds
          }
        },
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
    }

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

