import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id

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
      return NextResponse.json([])
    }

    const categories = await prisma.category.findMany({
      where: {
        householdId: household.id
      },
      include: {
        children: {
          include: {
            children: true,
            _count: {
              select: { items: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    })

    // Return all categories - let the frontend build the hierarchy
    // Add debug information for duplicate checking
    const nameCounts = categories.reduce((acc, category) => {
      const key = `${category.name}_${category.level}_${category.parentId || 'null'}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const duplicates = Object.entries(nameCounts)
      .filter(([key, count]) => count > 1)
      .map(([key, count]) => ({ key, count }))

    return NextResponse.json({
      categories,
      debug: {
        totalCategories: categories.length,
        nameCounts,
        duplicates,
        householdId: household.id
      }
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id

    const body = await request.json()
    const { name, description, level, parentId } = body

    // Get user's household
    let household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      // Create a default household for the user
      household = await prisma.household.create({
        data: {
          name: `${session.user.name || session.user.email}'s Household`,
          members: {
            create: {
              userId: userId,
              role: 'OWNER'
            }
          }
        }
      })
    }

    // Validate parent category if provided
    if (parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: parentId,
          householdId: household.id
        }
      })

      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        )
      }
    }

    // Check for duplicate category name in the same household and level
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: name,
        householdId: household.id,
        level: level,
        parentId: parentId || null // Also check if it's under the same parent
      }
    })

    if (existingCategory) {
      const levelText = level === 1 ? 'main category' : level === 2 ? 'subcategory' : 'sub-subcategory'
      return NextResponse.json(
        { 
          error: `${levelText} with this name already exists`,
          duplicateName: name,
          suggestion: `Consider using a different name or check if you meant to edit the existing "${name}" ${levelText}.`
        },
        { status: 409 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        level,
        parentId: parentId || null,
        householdId: household.id
      }
    })

    // Note: Activity logging removed as Activity model doesn't exist in schema

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}


