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
    const { newLevel, newParentId, householdId } = body

    // Resolve user's household (prefer explicit householdId)
    let household: any = null
    if (householdId) {
      const membership = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } },
        select: { householdId: true }
      })
      if (membership) {
        household = { id: membership.householdId }
      }
    }
    if (!household) {
      household = await prisma.household.findFirst({
        where: {
          members: {
            some: {
              userId: userId
            }
          }
        },
        include: {
          categories: true
        }
      })
    }

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
      console.error(`Category not found: categoryId=${categoryId}, householdId=${household.id}`)
      console.error(`Available categories:`, (household as any).categories?.map((c: any) => ({ id: c.id, name: c.name })))
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

    // First, get all subcategories that need to be moved with this category
    const getAllSubcategories = async (parentId: string, level: number): Promise<any[]> => {
      try {
        const directChildren = await prisma.category.findMany({
          where: {
            parentId: parentId,
            householdId: household.id
          }
        })
        
        let allChildren = [...directChildren]
        
        // Recursively get children of children
        for (const child of directChildren) {
          const grandChildren = await getAllSubcategories(child.id, level + 1)
          allChildren = [...allChildren, ...grandChildren]
        }
        
        return allChildren
      } catch (error) {
        console.error('Error fetching subcategories:', error)
        return []
      }
    }

    let subcategories: any[] = []
    let itemsUsingCategory: any[] = []
    let levelAdjustment = 0
    let categoryIds: string[] = []
    
    try {
      subcategories = await getAllSubcategories(categoryId, category.level + 1)
      console.log(`Moving category "${category.name}" with ${subcategories.length} subcategories`)

      // Calculate level adjustments for subcategories
      levelAdjustment = newLevel - category.level

      // Get all items that use this category or any of its subcategories
      categoryIds = [categoryId, ...subcategories.map(sc => sc.id)]
      itemsUsingCategory = await prisma.item.findMany({
        where: {
          categoryId: {
            in: categoryIds
          },
          householdId: household.id
        },
        select: {
          id: true,
          name: true,
          categoryId: true
        }
      })

      console.log(`Found ${itemsUsingCategory.length} items using this category tree`)
    } catch (error) {
      console.error('Error preparing category move:', error)
      return NextResponse.json(
        { error: 'Failed to prepare category move. Please try again.' },
        { status: 500 }
      )
    }

    // Use transaction to ensure data consistency
    let result: any
    try {
      result = await prisma.$transaction(async (tx) => {
      // Update the main category
      const updatedCategory = await tx.category.update({
        where: {
          id: categoryId
        },
        data: {
          level: newLevel,
          parentId: newParentId || null
        }
      })

      // Update all subcategories to maintain the tree structure
      for (const subcategory of subcategories) {
        const newSubLevel = subcategory.level + levelAdjustment
        
        // Ensure subcategory level doesn't exceed maximum (3)
        if (newSubLevel <= 3) {
          await tx.category.update({
            where: {
              id: subcategory.id
            },
            data: {
              level: newSubLevel
            }
          })
          console.log(`Updated subcategory "${subcategory.name}" to level ${newSubLevel}`)
        } else {
          console.warn(`Subcategory "${subcategory.name}" would exceed max level, skipping`)
        }
      }

      // Log the category move in item history for all items using this category tree
      for (const item of itemsUsingCategory) {
        const itemCategory = categoryIds.includes(item.categoryId) ? 
          (item.categoryId === categoryId ? category : subcategories.find(sc => sc.id === item.categoryId)) :
          null

        if (itemCategory) {
          await tx.itemHistory.create({
            data: {
              itemId: item.id,
              action: 'category_moved',
              description: `Category tree "${category.name}" was moved to level ${newLevel}${newParentId ? ' under new parent' : ''}. Item "${item.name}" uses subcategory "${itemCategory.name}"`,
              performedBy: userId
            }
          })
        }
      }

        return updatedCategory
      }, {
        timeout: 10000 // 10 second timeout
      })
    } catch (error: any) {
      console.error('Transaction error moving category:', error)
      // More specific error messages
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Category move would create a duplicate. Please check category names.' },
          { status: 409 }
        )
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Category not found. It may have been deleted.' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `Failed to move category: ${error.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Return safe response structure
    return NextResponse.json({
      success: true,
      message: 'Category moved successfully',
      category: {
        id: result.id,
        name: result.name,
        level: result.level,
        parentId: result.parentId
      },
      subcategoriesMoved: subcategories.length,
      itemsUpdated: itemsUsingCategory.length
    })
  } catch (error: any) {
    console.error('Error moving category:', error)
    return NextResponse.json(
      { error: `Failed to move category: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}
