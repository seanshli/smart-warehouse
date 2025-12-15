import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/maintenance/crews - List working crews
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    const communityId = searchParams.get('communityId')

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    let where: any = {}
    if (buildingId) where.buildingId = buildingId
    if (communityId) where.communityId = communityId

    const crews = await prisma.workingCrew.findMany({
      where,
      include: {
        building: {
          select: {
            id: true,
            name: true
          }
        },
        community: {
          select: {
            id: true,
            name: true
          }
        },
        crewLead: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            tickets: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ crews })
  } catch (error: any) {
    console.error('Error fetching crews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crews', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/admin/maintenance/crews - Create working crew
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, crewType, buildingId, communityId, crewLeadId } = body

    if (!name || !crewType) {
      return NextResponse.json({ error: 'name and crewType are required' }, { status: 400 })
    }

    if (!buildingId && !communityId) {
      return NextResponse.json({ error: 'buildingId or communityId is required' }, { status: 400 })
    }

    if (buildingId && communityId) {
      return NextResponse.json({ error: 'Cannot specify both buildingId and communityId' }, { status: 400 })
    }

    const crew = await prisma.workingCrew.create({
      data: {
        name,
        description,
        crewType,
        buildingId: buildingId || null,
        communityId: communityId || null,
        crewLeadId: crewLeadId || null
      },
      include: {
        building: {
          select: {
            id: true,
            name: true
          }
        },
        community: {
          select: {
            id: true,
            name: true
          }
        },
        crewLead: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ crew }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating crew:', error)
    return NextResponse.json(
      { error: 'Failed to create crew', details: error.message },
      { status: 500 }
    )
  }
}
