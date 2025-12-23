import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// PUT /api/catering/categories/[id] - Update category (admin only)
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
    const { name, description, displayOrder, isActive, parentId, timeSlots } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Get existing category to check level
    const existingCategory = await prisma.cateringCategory.findUnique({
      where: { id: params.id },
      select: { level: true, serviceId: true },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Determine level if parentId is being changed
    let finalLevel = existingCategory.level
    if (parentId !== undefined) {
      if (parentId) {
        // Verify parent exists and set level to 2
        const parent = await prisma.cateringCategory.findUnique({
          where: { id: parentId },
        })
        
        if (!parent) {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 404 }
          )
        }
        
        if (parent.serviceId !== existingCategory.serviceId) {
          return NextResponse.json(
            { error: 'Parent category must belong to the same service' },
            { status: 400 }
          )
        }
        
        if (parent.level === 2) {
          return NextResponse.json(
            { error: 'Cannot create sub-category of a sub-category (max 2 levels)' },
            { status: 400 }
          )
        }
        
        finalLevel = 2
      } else {
        // If no parent, it's a top-level category
        finalLevel = 1
      }
    }

    // Update category with hierarchy and time slots
    const updateData: any = {
      name,
      description: description || null,
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
      level: finalLevel,
    }

    if (parentId !== undefined) {
      updateData.parentId = parentId || null
    }

    // Handle time slots
    if (timeSlots !== undefined) {
      // Delete existing time slots
      await prisma.cateringCategoryTimeSlot.deleteMany({
        where: { categoryId: params.id },
      })

      // Create new time slots if provided
      if (Array.isArray(timeSlots) && timeSlots.length > 0) {
        updateData.timeSlots = {
          create: timeSlots.map((slot: any) => ({
            dayOfWeek: slot.dayOfWeek !== undefined ? slot.dayOfWeek : -1,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isWeekend: slot.isWeekend !== undefined ? slot.isWeekend : null,
          })),
        }
      }
    }

    const category = await prisma.cateringCategory.update({
      where: { id: params.id },
      data: updateData,
      include: {
        parent: {
          select: { id: true, name: true, level: true },
        },
        children: {
          select: { id: true, name: true, level: true },
        },
        timeSlots: true,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/catering/categories/[id] - Delete category (admin only)
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

    // Check if category has menu items
    const menuItemsCount = await prisma.cateringMenuItem.count({
      where: { categoryId: params.id },
    })

    if (menuItemsCount > 0) {
      // Instead of deleting, just unassign items from this category
      await prisma.cateringMenuItem.updateMany({
        where: { categoryId: params.id },
        data: { categoryId: null },
      })
    }

    await prisma.cateringCategory.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
