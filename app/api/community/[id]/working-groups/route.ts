import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityPermission, isCommunityMember } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/community/[id]/working-groups
 * Get all working groups in a community
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

    const workingGroups = await prisma.workingGroup.findMany({
      where: { communityId },
      include: {
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

    return NextResponse.json({
      workingGroups: workingGroups.map(wg => ({
        id: wg.id,
        name: wg.name,
        description: wg.description,
        type: wg.type,
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
 * POST /api/community/[id]/working-groups
 * Create a new working group
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
    const { name, description, type } = body

    if (!name) {
      return NextResponse.json({ error: 'Working group name is required' }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: 'Working group type is required' }, { status: 400 })
    }

    // Check permission
    if (!(await checkCommunityPermission(userId, communityId, 'canCreateWorkingGroups'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const workingGroup = await prisma.workingGroup.create({
      data: {
        communityId,
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

    return NextResponse.json({
      id: workingGroup.id,
      name: workingGroup.name,
      description: workingGroup.description,
      type: workingGroup.type,
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

