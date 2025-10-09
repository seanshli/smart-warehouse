import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

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

    // Get all categories with full details
    const allCategories = await prisma.category.findMany({
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
        },
        parent: {
          select: {
            id: true,
            name: true,
            level: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    })

    // Get all items with their categories
    const itemsWithCategories = await prisma.item.findMany({
      where: {
        householdId: household.id
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            level: true,
            parentId: true
          }
        }
      }
    })

    return NextResponse.json({
      household: {
        id: household.id,
        name: household.name
      },
      categories: allCategories,
      items: itemsWithCategories,
      summary: {
        totalCategories: allCategories.length,
        level1Categories: allCategories.filter(c => c.level === 1).length,
        level2Categories: allCategories.filter(c => c.level === 2).length,
        level3Categories: allCategories.filter(c => c.level === 3).length,
        totalItems: itemsWithCategories.length
      }
    })
  } catch (error) {
    console.error('Error in debug categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    )
  }
}
