import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// GET /api/catering/categories - Get categories for a service (filtered by building/community)
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
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Find service based on building or community
    let service = null
    if (buildingId) {
      service = await prisma.cateringService.findUnique({
        where: { buildingId },
      })
    } else if (communityId) {
      service = await prisma.cateringService.findUnique({
        where: { communityId },
      })
    }

    if (!service) {
      return NextResponse.json({ categories: [] }, { status: 200 })
    }

    // Get categories for this service
    const categories = await prisma.cateringCategory.findMany({
      where: {
        serviceId: service.id,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/catering/categories - Create category (admin only)
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
    const { serviceId, name, description, displayOrder = 0, isActive = true } = body

    // Validate required fields - categories only need serviceId and name
    if (!serviceId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, name' },
        { status: 400 }
      )
    }

    // Verify service exists
    const service = await prisma.cateringService.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Catering service not found' },
        { status: 404 }
      )
    }

    // Create category
    const category = await prisma.cateringCategory.create({
      data: {
        serviceId,
        name,
        description: description || null,
        displayOrder: parseInt(displayOrder) || 0,
        isActive,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
