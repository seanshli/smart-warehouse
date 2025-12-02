import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/working-groups
 * Get all working groups for a building (filtered by building-specific permissions)
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
    const buildingId = params.id

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

    // Get all working groups in the community
    const allWorkingGroups = await prisma.workingGroup.findMany({
      where: { communityId: building.communityId },
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
    })
  } catch (error) {
    console.error('Error fetching building working groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch working groups' },
      { status: 500 }
    )
  }
}

