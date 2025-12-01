import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityPermission, isCommunityMember } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/community
 * List all communities the user is a member of
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get all communities where user is a member
    const memberships = await prisma.communityMember.findMany({
      where: { userId },
      include: {
        community: {
          include: {
            _count: {
              select: {
                buildings: true,
                members: true,
                workingGroups: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    })

    return NextResponse.json({
      communities: memberships.map(m => ({
        id: m.community.id,
        name: m.community.name,
        description: m.community.description,
        address: m.community.address,
        city: m.community.city,
        district: m.community.district,
        country: m.community.country,
        role: m.role,
        joinedAt: m.joinedAt,
        stats: {
          buildings: m.community._count.buildings,
          members: m.community._count.members,
          workingGroups: m.community._count.workingGroups,
        },
      })),
    })
  } catch (error) {
    console.error('Error fetching communities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/community
 * Create a new community
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { name, description, address, city, district, country, latitude, longitude } = body

    if (!name) {
      return NextResponse.json({ error: 'Community name is required' }, { status: 400 })
    }

    // Create community
    const community = await prisma.community.create({
      data: {
        name,
        description,
        address,
        city,
        district,
        country,
        latitude,
        longitude,
        members: {
          create: {
            userId,
            role: 'ADMIN', // Creator becomes ADMIN
          },
        },
      },
      include: {
        _count: {
          select: {
            buildings: true,
            members: true,
            workingGroups: true,
          },
        },
      },
    })

    // Initialize working groups for the new community
    try {
      const { initializeCommunitySetup } = await import('@/lib/working-groups-init')
      await initializeCommunitySetup(community.id)
    } catch (error) {
      console.error('Error initializing working groups for community:', error)
      // Continue even if initialization fails
    }

    return NextResponse.json({
      id: community.id,
      name: community.name,
      description: community.description,
      address: community.address,
      city: community.city,
      district: community.district,
      country: community.country,
      invitationCode: community.invitationCode,
      stats: {
        buildings: community._count.buildings,
        members: community._count.members,
        workingGroups: community._count.workingGroups,
      },
      createdAt: community.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating community:', error)
    return NextResponse.json(
      { error: 'Failed to create community' },
      { status: 500 }
    )
  }
}

