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

    // Try to include options if table exists, otherwise return without options
    let menuItemsWithOptions: any[] = service.menuItems
    try {
      // Try to fetch options for menu items if the table exists
      const menuItemsWithOptionsData = await Promise.all(
        service.menuItems.map(async (item) => {
          try {
            // Use $queryRaw to check if table exists first
            const tableCheck = await prisma.$queryRaw`
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'catering_menu_item_options'
              )
            `
            const tableExists = (tableCheck as any[])[0]?.exists
            
            if (tableExists) {
              const itemWithOptions = await (prisma as any).cateringMenuItem.findUnique({
                where: { id: item.id },
                include: {
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
              return itemWithOptions || item
            }
            return item
          } catch (err: any) {
            // If options table doesn't exist, return item without options
            if (err.code === 'P2021' || err.message?.includes('does not exist') || err.message?.includes('Unknown arg')) {
              return item
            }
            throw err
          }
        })
      )
      menuItemsWithOptions = menuItemsWithOptionsData
    } catch (optionsError: any) {
      // If options table doesn't exist, continue without options
      if (optionsError.code === 'P2021' || optionsError.message?.includes('does not exist') || optionsError.message?.includes('Unknown arg')) {
        console.log('[Menu API] Options table not found, returning items without options')
        menuItemsWithOptions = service.menuItems
      } else {
        throw optionsError
      }
    }

    return NextResponse.json({
      service: {
        id: service.id,
        buildingId: service.buildingId,
        communityId: service.communityId,
        isActive: service.isActive,
      },
      categories: service.categories,
      menuItems: menuItemsWithOptions,
    })
  } catch (error: any) {
    console.error('Error fetching catering menu:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    
    // If it's a schema error (table doesn't exist), return empty menu instead of 500
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.log('[Menu API] Schema error detected, returning empty menu')
      return NextResponse.json({
        service: null,
        categories: [],
        menuItems: [],
        message: 'Menu schema not ready. Please run database migrations.',
      }, { status: 200 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch catering menu', details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
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

    // Check if options table exists before trying to create with options
    let optionsTableExists = false
    if (options && options.length > 0) {
      try {
        const tableCheck = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'catering_menu_item_options'
          )
        `
        optionsTableExists = (tableCheck as any[])[0]?.exists
      } catch (checkError) {
        console.log('[Menu API] Could not check options table, will skip options')
        optionsTableExists = false
      }
    }

    // Create menu item (with options only if table exists)
    const createData: any = {
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
    }

    // Only include options if table exists and options are provided
    if (optionsTableExists && options && options.length > 0) {
      createData.options = {
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
      }
    }

    const menuItem = await prisma.cateringMenuItem.create({
      data: createData,
      include: {
        category: true,
        timeSlots: true,
      },
    })

    // Try to include options in response if table exists
    let menuItemWithOptions: any = menuItem
    if (optionsTableExists) {
      try {
        const itemWithOptions = await (prisma as any).cateringMenuItem.findUnique({
          where: { id: menuItem.id },
          include: {
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
        if (itemWithOptions) {
          menuItemWithOptions = itemWithOptions
        }
      } catch (optionsError: any) {
        console.log('[Menu API] Could not fetch options, returning item without options')
      }
    }

    return NextResponse.json(menuItemWithOptions, { status: 201 })
  } catch (error: any) {
    console.error('Error creating menu item:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    
    return NextResponse.json(
      { error: 'Failed to create menu item', details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
      { status: 500 }
    )
  }
}
