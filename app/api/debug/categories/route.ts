import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    const categories = await prisma.category.findMany({
      where: {
        householdId: household.id
      },
      include: {
        children: {
          include: {
            children: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    })

    // Check for duplicates
    const nameCounts = categories.reduce((acc, category) => {
      const key = `${category.name}_${category.level}_${category.parentId || 'null'}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const duplicates = Object.entries(nameCounts)
      .filter(([key, count]) => count > 1)
      .map(([key, count]) => ({ key, count }))

    return NextResponse.json({
      householdId: household.id,
      totalCategories: categories.length,
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        level: cat.level,
        parentId: cat.parentId,
        childrenCount: cat.children.length,
        children: cat.children.map(child => ({
          id: child.id,
          name: child.name,
          level: child.level,
          grandChildrenCount: child.children.length
        }))
      })),
      duplicates,
      nameCounts
    })
  } catch (error) {
    console.error('Error debugging categories:', error)
    return NextResponse.json(
      { error: 'Failed to debug categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}