import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categoryId = params.id
    const userId = (session?.user as any)?.id
    const body = await request.json()
    const { newLevel, newParentId } = body

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Verify category belongs to user's household
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        householdId: household.id
      },
      include: {
        _count: {
          select: {
            items: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 })
    }

    // Validate new parent if provided
    if (newParentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: newParentId,
          householdId: household.id
        }
      })

      if (!parentCategory) {
        return NextResponse.json({ error: 'Parent category not found or access denied' }, { status: 404 })
      }

      // Validate parent level (should be one level higher)
      if (parentCategory.level !== newLevel - 1) {
        return NextResponse.json(
          { error: `Parent category must be level ${newLevel - 1} for a level ${newLevel} category` },
          { status: 400 }
        )
      }
    }

    // Check if category has children that would become invalid
    if (category._count.children > 0 && newLevel === 3) {
      return NextResponse.json(
        { error: 'Cannot move category with children to level 3 (maximum level)' },
        { status: 400 }
      )
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update the category
      const updatedCategory = await tx.category.update({
        where: {
          id: categoryId
        },
        data: {
          level: newLevel,
          parentId: newParentId || null
        }
      })

      // Update all items that reference this category
      // This ensures items maintain their category reference even after the move
      await tx.item.updateMany({
        where: {
          categoryId: categoryId
        },
        data: {
          // No changes needed to item data, just ensure the reference is maintained
        }
      })

      // Log the category move in item history for all items using this category
      const itemsUsingCategory = await tx.item.findMany({
        where: {
          categoryId: categoryId
        },
        select: {
          id: true
        }
      })

      for (const item of itemsUsingCategory) {
        await tx.itemHistory.create({
          data: {
            itemId: item.id,
            action: 'category_moved',
            description: `Category "${category.name}" was moved to level ${newLevel}${newParentId ? ' under new parent' : ''}`,
            performedBy: userId
          }
        })
      }

      return updatedCategory
    })

    return NextResponse.json({
      message: 'Category moved successfully',
      category: result,
      itemsUpdated: category._count.items
    })
  } catch (error) {
    console.error('Error moving category:', error)
    return NextResponse.json(
      { error: 'Failed to move category' },
      { status: 500 }
    )
  }
}
