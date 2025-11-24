import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/communities
 * Get communities where user is admin or super admin
 * - Super admin (isAdmin=true): can see all communities
 * - Community admin (ADMIN role): can only see their own communities
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

    let communities

    if (user.isAdmin) {
      // Super admin: can see all communities
      communities = await prisma.community.findMany({
        include: {
          _count: {
            select: {
              buildings: true,
              members: true,
              workingGroups: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } else {
      // Community admin: only see communities where they are ADMIN or MANAGER
      const memberships = await prisma.communityMember.findMany({
        where: {
          userId,
          role: {
            in: ['ADMIN', 'MANAGER']
          }
        },
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

      communities = memberships.map(m => m.community)
    }

    return NextResponse.json({
      communities: communities.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        address: c.address,
        city: c.city,
        district: c.district,
        country: c.country,
        createdAt: c.createdAt,
        stats: {
          buildings: c._count.buildings,
          members: c._count.members,
          workingGroups: c._count.workingGroups,
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

