import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingAccess } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/admins
 * Get all admins (building admins, community admins) for a building
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

    const userId = (session.user as any).id
    const resolvedParams = await Promise.resolve(params)
    const buildingId = resolvedParams.id

    // Check access
    if (!(await checkBuildingAccess(userId, buildingId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get building with community
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: {
        id: true,
        name: true,
        communityId: true,
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    // Get building admins/managers
    const buildingAdmins = await prisma.buildingMember.findMany({
      where: {
        buildingId,
        role: { in: ['ADMIN', 'MANAGER'] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Get community admins/managers if building belongs to a community
    let communityAdmins: any[] = []
    if (building.communityId) {
      communityAdmins = await prisma.communityMember.findMany({
        where: {
          communityId: building.communityId,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    }

    // Get other building admins in the same community
    let otherBuildingAdmins: any[] = []
    if (building.communityId) {
      const otherBuildings = await prisma.building.findMany({
        where: {
          communityId: building.communityId,
          id: { not: buildingId },
        },
        select: { id: true },
      })

      const otherBuildingIds = otherBuildings.map(b => b.id)
      if (otherBuildingIds.length > 0) {
        const admins = await prisma.buildingMember.findMany({
          where: {
            buildingId: { in: otherBuildingIds },
            role: { in: ['ADMIN', 'MANAGER'] },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            building: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
        otherBuildingAdmins = admins
      }
    }

    // Combine and deduplicate by userId
    const adminMap = new Map<string, any>()
    
    buildingAdmins.forEach(admin => {
      adminMap.set(admin.userId, {
        userId: admin.userId,
        name: admin.user.name,
        email: admin.user.email,
        role: admin.role,
        type: 'building',
        buildingId: buildingId,
        buildingName: building.name,
      })
    })

    communityAdmins.forEach(admin => {
      if (!adminMap.has(admin.userId)) {
        adminMap.set(admin.userId, {
          userId: admin.userId,
          name: admin.user.name,
          email: admin.user.email,
          role: admin.role,
          type: 'community',
          communityId: building.communityId,
        })
      }
    })

    otherBuildingAdmins.forEach(admin => {
      if (!adminMap.has(admin.userId)) {
        adminMap.set(admin.userId, {
          userId: admin.userId,
          name: admin.user.name,
          email: admin.user.email,
          role: admin.role,
          type: 'building',
          buildingId: admin.building.id,
          buildingName: admin.building.name,
        })
      }
    })

    return NextResponse.json({
      admins: Array.from(adminMap.values()),
    })
  } catch (error) {
    console.error('Error fetching building admins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch building admins' },
      { status: 500 }
    )
  }
}
