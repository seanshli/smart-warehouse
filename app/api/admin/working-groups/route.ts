import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/working-groups
 * Get all working groups across all communities and buildings (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, adminRole: true },
    })

    if (!user?.isAdmin || user.adminRole !== 'SUPERUSER') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')
    const buildingId = searchParams.get('buildingId')

    // Build where clause
    let whereClause: any = {}
    if (communityId) {
      whereClause.communityId = communityId
    }

    // Get all working groups
    const workingGroups = await prisma.workingGroup.findMany({
      where: whereClause,
      include: {
        community: {
          select: {
            id: true,
            name: true,
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
        permissions: {
          include: {
            building: buildingId ? {
              where: { id: buildingId },
              select: {
                id: true,
                name: true,
              },
            } : undefined,
          },
        },
        _count: {
          select: {
            members: true,
            permissions: true,
          },
        },
      },
      orderBy: [
        { community: { name: 'asc' } },
        { name: 'asc' },
      ],
    })

    // Filter by building if specified
    let filteredGroups = workingGroups
    if (buildingId) {
      filteredGroups = workingGroups.filter(wg => 
        wg.permissions.some(p => 
          p.scope === 'ALL_BUILDINGS' || 
          (p.scope === 'SPECIFIC_BUILDING' && p.scopeId === buildingId)
        )
      )
    }

    return NextResponse.json({
      workingGroups: filteredGroups.map(wg => ({
        id: wg.id,
        name: wg.name,
        description: wg.description,
        type: wg.type,
        communityId: wg.communityId,
        community: wg.community,
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
      })),
    })
  } catch (error) {
    console.error('Error fetching working groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch working groups' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/working-groups
 * Create a new working group (super admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, adminRole: true },
    })

    if (!user?.isAdmin || user.adminRole !== 'SUPERUSER') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { communityId, name, description, type } = body

    if (!communityId || !name || !type) {
      return NextResponse.json(
        { error: 'Community ID, name, and type are required' },
        { status: 400 }
      )
    }

    // Verify community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const workingGroup = await prisma.workingGroup.create({
      data: {
        communityId,
        name,
        description,
        type: type.toUpperCase().replace(/\s+/g, '_'),
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
            members: true,
            permissions: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: workingGroup.id,
      name: workingGroup.name,
      description: workingGroup.description,
      type: workingGroup.type,
      communityId: workingGroup.communityId,
      community: workingGroup.community,
      stats: {
        members: workingGroup._count.members,
        permissions: workingGroup._count.permissions,
      },
      createdAt: workingGroup.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating working group:', error)
    return NextResponse.json(
      { error: 'Failed to create working group' },
      { status: 500 }
    )
  }
}

