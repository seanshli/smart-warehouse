import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// GET /api/catering/service - Get service availability
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = createPrismaClient()
    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    const communityId = searchParams.get('communityId')

    let service = null
    if (buildingId) {
      service = await prisma.cateringService.findUnique({
        where: { buildingId },
        include: {
          building: {
            select: { id: true, name: true },
          },
        },
      })
    } else if (communityId) {
      service = await prisma.cateringService.findUnique({
        where: { communityId },
        include: {
          community: {
            select: { id: true, name: true },
          },
        },
      })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error fetching catering service:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catering service' },
      { status: 500 }
    )
  }
}

// POST /api/catering/service - Create/enable service (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = createPrismaClient()
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { buildingId, communityId, isActive = true } = body

    if (!buildingId && !communityId) {
      return NextResponse.json(
        { error: 'Either buildingId or communityId is required' },
        { status: 400 }
      )
    }

    if (buildingId && communityId) {
      return NextResponse.json(
        { error: 'Cannot specify both buildingId and communityId' },
        { status: 400 }
      )
    }

    // Check if service already exists
    const existing = buildingId
      ? await prisma.cateringService.findUnique({ where: { buildingId } })
      : await prisma.cateringService.findUnique({ where: { communityId } })

    if (existing) {
      return NextResponse.json(
        { error: 'Service already exists for this building/community' },
        { status: 400 }
      )
    }

    const service = await prisma.cateringService.create({
      data: {
        buildingId: buildingId || null,
        communityId: communityId || null,
        isActive,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating catering service:', error)
    return NextResponse.json(
      { error: 'Failed to create catering service' },
      { status: 500 }
    )
  }
}

// PUT /api/catering/service - Update service (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = createPrismaClient()
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    const service = await prisma.cateringService.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error updating catering service:', error)
    return NextResponse.json(
      { error: 'Failed to update catering service' },
      { status: 500 }
    )
  }
}
