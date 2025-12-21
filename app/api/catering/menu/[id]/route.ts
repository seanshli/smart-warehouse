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
    const menuItem = await prisma.cateringMenuItem.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        timeSlots: true,
        service: {
          include: {
            building: true,
            community: true,
          },
        },
      },
    })

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

    const menuItem = await prisma.cateringMenuItem.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        timeSlots: true,
      },
    })

    return NextResponse.json(menuItem)
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
