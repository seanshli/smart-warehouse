import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// GET /api/catering/menu - Get menu items (filtered by building/community)
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
    const categoryId = searchParams.get('categoryId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Find service based on building or community
    let service = null
    if (buildingId) {
      service = await prisma.cateringService.findUnique({
        where: { buildingId },
        include: {
          categories: {
            where: includeInactive ? undefined : { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
          menuItems: {
            where: {
              ...(includeInactive ? {} : { isActive: true }),
              ...(categoryId ? { categoryId } : {}),
            },
            include: {
              category: true,
              timeSlots: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    } else if (communityId) {
      service = await prisma.cateringService.findUnique({
        where: { communityId },
        include: {
          categories: {
            where: includeInactive ? undefined : { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
          menuItems: {
            where: {
              ...(includeInactive ? {} : { isActive: true }),
              ...(categoryId ? { categoryId } : {}),
            },
            include: {
              category: true,
              timeSlots: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    }

    if (!service) {
      return NextResponse.json({ 
        service: null,
        categories: [],
        menuItems: [],
        message: 'Catering service not available for this building/community'
      }, { status: 200 }) // Return 200 so frontend can handle gracefully
    }

    if (!service.isActive) {
      return NextResponse.json({ 
        service: {
          id: service.id,
          buildingId: service.buildingId,
          communityId: service.communityId,
          isActive: service.isActive,
        },
        categories: [],
        menuItems: [],
        message: 'Catering service is currently inactive'
      }, { status: 200 })
    }

    return NextResponse.json({
      service: {
        id: service.id,
        buildingId: service.buildingId,
        communityId: service.communityId,
        isActive: service.isActive,
      },
      categories: service.categories,
      menuItems: service.menuItems,
    })
  } catch (error) {
    console.error('Error fetching catering menu:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catering menu' },
      { status: 500 }
    )
  }
}

// POST /api/catering/menu - Create menu item (admin only)
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
    const {
      serviceId,
      categoryId,
      name,
      description,
      imageUrl,
      cost,
      quantityAvailable,
      isActive = true,
      availableAllDay = true,
      timeSlots = [],
    } = body

    if (!serviceId || !name || cost === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, name, cost' },
        { status: 400 }
      )
    }

    // Create menu item
    const menuItem = await prisma.cateringMenuItem.create({
      data: {
        serviceId,
        categoryId: categoryId || null,
        name,
        description,
        imageUrl,
        cost: parseFloat(cost),
        quantityAvailable: parseInt(quantityAvailable) || 0,
        isActive,
        availableAllDay,
        timeSlots: {
          create: timeSlots.map((slot: any) => ({
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        },
      },
      include: {
        category: true,
        timeSlots: true,
      },
    })

    return NextResponse.json(menuItem, { status: 201 })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}
