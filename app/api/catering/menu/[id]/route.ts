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
    // Use try-catch to handle schema errors gracefully
    // IMPORTANT: Use select to explicitly include imageUrl to avoid schema issues with older items
    let menuItem: any
    try {
      menuItem = await prisma.cateringMenuItem.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          name: true,
          description: true,
          cost: true,
          quantityAvailable: true,
          isActive: true,
          availableAllDay: true,
          imageUrl: true, // Explicitly select imageUrl
          categoryId: true,
          serviceId: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          timeSlots: {
            select: {
              id: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
            },
          },
          service: {
            select: {
              id: true,
              building: {
                select: {
                  id: true,
                  name: true,
                },
              },
              community: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })
      
      // Try to include category timeSlots if they exist (for older items)
      if (menuItem?.category) {
        try {
          const categoryWithTimeSlots = await (prisma as any).cateringCategory.findUnique({
            where: { id: menuItem.category.id },
            include: {
              timeSlots: true,
            },
          })
          if (categoryWithTimeSlots?.timeSlots) {
            menuItem.category.timeSlots = categoryWithTimeSlots.timeSlots
          }
        } catch (timeSlotError: any) {
          // If timeSlots table doesn't exist or query fails, that's okay
          if (timeSlotError.code !== 'P2021' && !timeSlotError.message?.includes('does not exist')) {
            console.warn('[Menu Item API] Error fetching category timeSlots (non-critical):', timeSlotError.message)
          }
        }
      }
    } catch (queryError: any) {
      console.error('[Menu Item API] Error fetching menu item:', queryError)
      console.error('[Menu Item API] Error details:', {
        code: queryError.code,
        message: queryError.message,
        meta: queryError.meta,
      })
      
      // If schema error, try simpler query
      if (queryError.code === 'P2021' || queryError.message?.includes('does not exist')) {
        console.log('[Menu Item API] Schema error detected, trying simpler query...')
        try {
          menuItem = await prisma.cateringMenuItem.findUnique({
            where: { id: params.id },
          })
          if (!menuItem) {
            return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
          }
        } catch (simpleError: any) {
          console.error('[Menu Item API] Simpler query also failed:', simpleError)
          return NextResponse.json(
            { 
              error: 'Database schema error. Please check if catering_menu_items table exists.',
              details: simpleError.message 
            },
            { status: 500 }
          )
        }
      } else {
        // Return 500 with error details
        return NextResponse.json(
          { 
            error: 'Failed to fetch menu item',
            details: queryError.message 
          },
          { status: 500 }
        )
      }
    }

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
    // Allow removing photo by setting imageUrl to null or empty string
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl === '' || imageUrl === null ? null : imageUrl
    }
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

    // Check if menu item exists
    const menuItem = await prisma.cateringMenuItem.findUnique({
      where: { id: params.id },
    })

    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    // Check if item is used in any ACTIVE orders (not cancelled or closed)
    // Only count orders that are still active (submitted, accepted, preparing, ready, delivered)
    // Cancelled and closed orders should not prevent deletion
    const activeOrderItems = await prisma.cateringOrderItem.findMany({
      where: {
        menuItemId: params.id,
        order: {
          status: {
            notIn: ['cancelled', 'closed'],
          },
        },
      },
      select: {
        orderId: true,
      },
    })

    const activeOrderCount = new Set(activeOrderItems.map(item => item.orderId)).size

    if (activeOrderCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete menu item. It is used in ${activeOrderCount} active order(s). Please cancel those orders first or deactivate the item instead.`,
          orderCount: activeOrderCount,
        },
        { status: 400 }
      )
    }

    // Delete using transaction to ensure all related data is removed
    await prisma.$transaction(async (tx) => {
      // Delete time slots (should cascade, but being explicit)
      await tx.cateringMenuItemTimeSlot.deleteMany({
        where: { menuItemId: params.id },
      })

      // Delete options and selections (if table exists)
      try {
        const tableCheck = await tx.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'catering_menu_item_options'
          )
        `
        const tableExists = (tableCheck as any[])[0]?.exists
        
        if (tableExists) {
          await (tx as any).cateringMenuItemOption.deleteMany({
            where: { menuItemId: params.id },
          })
        }
      } catch (optionsError: any) {
        // If options table doesn't exist, that's okay
        if (optionsError.code !== 'P2021' && !optionsError.message?.includes('does not exist')) {
          console.warn('[Menu Item Delete] Error deleting options (non-critical):', optionsError.message)
        }
      }

      // Finally, delete the menu item
      await tx.cateringMenuItem.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ message: 'Menu item deleted successfully' })
  } catch (error: any) {
    console.error('[Menu Item Delete] Error deleting menu item:', error)
    console.error('[Menu Item Delete] Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    
    // Provide more specific error messages
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete menu item: it is referenced by other records (e.g., orders). Please deactivate it instead.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to delete menu item' },
      { status: 500 }
    )
  }
}
