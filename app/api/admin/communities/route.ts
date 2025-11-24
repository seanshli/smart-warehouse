import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/communities
 * Get all communities (admin only)
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

    // Get all communities
    const communities = await prisma.community.findMany({
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

