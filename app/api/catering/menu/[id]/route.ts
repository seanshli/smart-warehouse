import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// GET /api/catering/menu/[id] - Get single menu item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = createPrismaClient()
    // Fetch menu item without options first (to avoid schema errors)
    let menuItem: any = await prisma.cateringMenuItem.findUnique({
      where: { id: params.id },
      include: {
        category: {
          include: {
            timeSlots: true,
          },
        },
        timeSlots: true,
        service: {
          include: {
            building: true,
            community: true,
          },
        },
      },
    })

    if (menuItem) {
      // Try to include options if table exists
      try {
        // Check if options table exists
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
            where: { id: params.id },
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
            menuItem = { ...menuItem, options: itemWithOptions.options }
          }
        }
      } catch (optionsError: any) {
        // If options table doesn't exist, continue without options
        if (optionsError.code === 'P2021' || optionsError.message?.includes('does not exist') || optionsError.message?.includes('Unknown arg')) {
          console.log('[Menu Item API] Options table not found, returning item without options')
        }
      }
    }

    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
      { status: 500 }
    )
  }
}

// PUT /api/catering/menu/[id] - Update menu item (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      categoryId,
      name,
      description,
      imageUrl,
      cost,
      quantityAvailable,
      isActive,
      availableAllDay,
      timeSlots,
      options,
    } = body

    // Update menu item
    const updateData: any = {}
    if (categoryId !== undefined) updateData.categoryId = categoryId || null
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (cost !== undefined) updateData.cost = parseFloat(cost)
    if (quantityAvailable !== undefined) updateData.quantityAvailable = parseInt(quantityAvailable)
    if (isActive !== undefined) updateData.isActive = isActive
    if (availableAllDay !== undefined) updateData.availableAllDay = availableAllDay

    // Handle time slots update
    if (timeSlots !== undefined) {
      // Delete existing time slots
      await prisma.cateringMenuItemTimeSlot.deleteMany({
        where: { menuItemId: params.id },
      })

      // Create new time slots
      if (Array.isArray(timeSlots) && timeSlots.length > 0) {
        updateData.timeSlots = {
          create: timeSlots.map((slot: any) => ({
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        }
      }
    }

    // Handle options update (only if table exists)
    if (options !== undefined) {
      try {
        // Check if options table exists
        const tableCheck = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'catering_menu_item_options'
          )
        `
        const tableExists = (tableCheck as any[])[0]?.exists
        
        if (tableExists) {
          // Try to delete existing options (cascades to selections)
          await (prisma as any).cateringMenuItemOption.deleteMany({
            where: { menuItemId: params.id },
          })

          // Create new options
          if (Array.isArray(options) && options.length > 0) {
            updateData.options = {
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
        } else {
          console.log('[Menu Item Update] Options table not found, skipping options update')
        }
      } catch (optionsError: any) {
        // If options table doesn't exist, skip options update
        if (optionsError.code === 'P2021' || optionsError.message?.includes('does not exist') || optionsError.message?.includes('Unknown arg')) {
          console.log('[Menu Item Update] Options table not found, skipping options update')
          // Remove options from updateData if it was added
          delete updateData.options
        } else {
          throw optionsError
        }
      }
    }

    const menuItem = await prisma.cateringMenuItem.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        timeSlots: true,
      },
    })

    // Try to include options in response if table exists
    let menuItemWithOptions: any = menuItem
    try {
      // Check if options table exists
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
          where: { id: params.id },
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
          menuItemWithOptions = { ...menuItem, options: itemWithOptions.options }
        }
      }
    } catch (optionsError: any) {
      // If options table doesn't exist, return without options
      if (optionsError.code === 'P2021' || optionsError.message?.includes('does not exist') || optionsError.message?.includes('Unknown arg')) {
        console.log('[Menu Item Update] Options table not found, returning item without options')
      }
    }

    return NextResponse.json(menuItemWithOptions)
  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    )
  }
}

// DELETE /api/catering/menu/[id] - Delete menu item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.cateringMenuItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Menu item deleted successfully' })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    )
  }
}
