import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityPermission } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/working-groups
 * Get all working groups for a building (filtered by building-specific permissions)
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
    const resolvedParams = params instanceof Promise ? await params : params
    const buildingId = resolvedParams.id

    // Get building to find community
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

    // Check if building has communityId
    if (!building.communityId) {
      return NextResponse.json({ 
        error: 'Building is not associated with a community',
        workingGroups: []
      }, { status: 200 })
    }

    // Check if user has permission to view working groups
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    let hasPermission = false

    if (currentUser?.isAdmin) {
      hasPermission = true
    } else {
      // Check if user is building admin/manager
      const buildingMembership = await prisma.buildingMember.findUnique({
        where: {
          userId_buildingId: {
            userId,
            buildingId,
          },
        },
        select: {
          role: true,
        },
      })

      if (buildingMembership && (buildingMembership.role === 'ADMIN' || buildingMembership.role === 'MANAGER')) {
        hasPermission = true
      } else {
        // Check if user is community admin/manager (only if building has communityId)
        if (building.communityId) {
          const communityMembership = await prisma.communityMember.findUnique({
            where: {
              userId_communityId: {
                userId,
                communityId: building.communityId,
              },
            },
            select: {
              role: true,
            },
          })

          if (communityMembership && (communityMembership.role === 'ADMIN' || communityMembership.role === 'MANAGER')) {
            hasPermission = true
          }
        }
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to view working groups' }, { status: 403 })
    }

    // Get all working groups in the community
    const allWorkingGroups = await prisma.workingGroup.findMany({
      where: { 
        communityId: building.communityId,
      },
      include: {
        permissions: {
          where: {
            OR: [
              { scope: 'ALL_BUILDINGS' },
              { 
                scope: 'SPECIFIC_BUILDING',
                scopeId: buildingId,
              },
            ],
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            permissions: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Filter to only groups that have permissions for this building
    const buildingWorkingGroups = allWorkingGroups
      .filter(wg => wg.permissions.length > 0)
      .map(wg => ({
        id: wg.id,
        name: wg.name,
        description: wg.description,
        type: wg.type,
        communityId: wg.communityId,
        members: wg.members.map(m => ({
          id: m.id,
          userId: m.user.id,
          userName: m.user.name,
          userEmail: m.user.email,
          role: m.role,
          assignedAt: m.assignedAt,
        })),
        permissions: wg.permissions.map(p => ({
          id: p.id,
          permission: p.permission,
          scope: p.scope,
          scopeId: p.scopeId,
        })),
        stats: {
          members: wg._count.members,
          permissions: wg._count.permissions,
        },
        createdAt: wg.createdAt,
        updatedAt: wg.updatedAt,
      }))

    return NextResponse.json({
      workingGroups: buildingWorkingGroups,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error: any) {
    console.error('Error fetching building working groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch working groups', details: error.message },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

/**
 * POST /api/building/[id]/working-groups
 * Create a new working group for this building
 */
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
    const resolvedParams = params instanceof Promise ? await params : params
    const buildingId = resolvedParams.id
    const body = await request.json()
    const { name, description, type } = body

    if (!name) {
      return NextResponse.json({ error: 'Working group name is required' }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: 'Working group type is required' }, { status: 400 })
    }

    // Get building to find community
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

    // Check if user is building admin/manager or super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    let hasPermission = false

    if (currentUser?.isAdmin) {
      hasPermission = true
    } else {
      // Check if user is building admin/manager
      const buildingMembership = await prisma.buildingMember.findUnique({
        where: {
          userId_buildingId: {
            userId,
            buildingId,
          },
        },
        select: {
          role: true,
        },
      })

      if (buildingMembership && (buildingMembership.role === 'ADMIN' || buildingMembership.role === 'MANAGER')) {
        hasPermission = true
      } else {
        // Check if user is community admin/manager
        if (!(await checkCommunityPermission(userId, building.communityId, 'canCreateWorkingGroups'))) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create working group in community
    const workingGroup = await prisma.workingGroup.create({
      data: {
        communityId: building.communityId,
        name,
        description,
        type,
      },
      include: {
        _count: {
          select: {
            members: true,
            permissions: true,
          },
        },
      },
    })

    // Create permission for this specific building
    await prisma.workingGroupPermission.create({
      data: {
        workingGroupId: workingGroup.id,
        permission: 'VIEW',
        scope: 'SPECIFIC_BUILDING',
        scopeId: buildingId,
      },
    })

    return NextResponse.json({
      id: workingGroup.id,
      name: workingGroup.name,
      description: workingGroup.description,
      type: workingGroup.type,
      communityId: workingGroup.communityId,
      stats: {
        members: workingGroup._count.members,
        permissions: workingGroup._count.permissions + 1, // +1 for the permission we just created
      },
      createdAt: workingGroup.createdAt,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating working group:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create working group',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
