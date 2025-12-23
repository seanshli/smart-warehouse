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

    // Find service based on building or community - ensures menu is scoped to specific building/community
    let service = null
    if (buildingId) {
      service = await prisma.cateringService.findUnique({
        where: { buildingId }, // Only get service for this specific building
        include: {
          categories: {
            where: includeInactive ? undefined : { isActive: true },
            include: {
              parent: {
                select: { id: true, name: true, level: true },
              },
              children: {
                where: includeInactive ? undefined : { isActive: true },
                select: { id: true, name: true, level: true, displayOrder: true },
                orderBy: { displayOrder: 'asc' },
              },
              timeSlots: true,
            },
            orderBy: [
              { level: 'asc' },
              { displayOrder: 'asc' },
              { name: 'asc' },
            ],
          },
          menuItems: {
            where: {
              ...(includeInactive ? {} : { isActive: true }),
              ...(categoryId ? { categoryId } : {}),
            },
            include: {
              category: {
                include: {
                  parent: {
                    select: { id: true, name: true, level: true },
                  },
                  timeSlots: true,
                },
              },
              timeSlots: true,
              options: {
                include: {
                  selections: true,
                },
                orderBy: {
                  displayOrder: 'asc',
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    } else if (communityId) {
      service = await prisma.cateringService.findUnique({
        where: { communityId }, // Only get service for this specific community
        include: {
          categories: {
            where: includeInactive ? undefined : { isActive: true },
            include: {
              parent: {
                select: { id: true, name: true, level: true },
              },
              children: {
                where: includeInactive ? undefined : { isActive: true },
                select: { id: true, name: true, level: true, displayOrder: true },
                orderBy: { displayOrder: 'asc' },
              },
              timeSlots: true,
            },
            orderBy: [
              { level: 'asc' },
              { displayOrder: 'asc' },
              { name: 'asc' },
            ],
          },
          menuItems: {
            where: {
              ...(includeInactive ? {} : { isActive: true }),
              ...(categoryId ? { categoryId } : {}),
            },
            include: {
              category: {
                include: {
                  parent: {
                    select: { id: true, name: true, level: true },
                  },
                  timeSlots: true,
                },
              },
              timeSlots: true,
              options: {
                include: {
                  selections: true,
                },
                orderBy: {
                  displayOrder: 'asc',
                },
              },
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
    
    // Check if this is a category creation request (should use /api/catering/categories)
    if (body.type === 'category') {
      return NextResponse.json(
        { error: 'Use /api/catering/categories endpoint to create categories' },
        { status: 400 }
      )
    }

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
      options = [],
    } = body

    // Menu items require: serviceId, name, and cost
    if (!serviceId || !name || cost === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, name, cost' },
        { status: 400 }
      )
    }

    // Verify service exists and get it to ensure proper scoping
    const service = await prisma.cateringService.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Catering service not found' },
        { status: 404 }
      )
    }

    // If categoryId is provided, verify it belongs to the same service
    if (categoryId) {
      const category = await prisma.cateringCategory.findUnique({
        where: { id: categoryId },
      })
      
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      
      if (category.serviceId !== serviceId) {
        return NextResponse.json(
          { error: 'Category does not belong to this service' },
          { status: 400 }
        )
      }
    }

    // Create menu item with options
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
        options: {
          create: options.map((opt: any) => ({
            optionName: opt.optionName,
            optionType: opt.optionType || 'select',
            isRequired: opt.isRequired || false,
            displayOrder: opt.displayOrder || 0,
            selections: {
              create: (opt.selections || []).map((sel: any) => ({
                selectionName: sel.selectionName,
                selectionValue: sel.selectionValue || sel.selectionName,
                displayOrder: sel.displayOrder || 0,
              })),
            },
          })),
        },
      },
      include: {
        category: true,
        timeSlots: true,
        options: {
          include: {
            selections: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
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
