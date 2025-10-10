import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
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
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
  }
}


