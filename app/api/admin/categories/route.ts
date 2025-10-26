import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    // Get all categories with item counts, aggregated by name
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Aggregate categories by name (case-insensitive)
    const aggregatedCategories = categories.reduce((acc, category) => {
      const normalizedName = category.name.toLowerCase().trim()
      const existingCategory = acc.find(cat => cat.name.toLowerCase().trim() === normalizedName)
      
      if (existingCategory) {
        existingCategory._count.items += category._count.items
      } else {
        acc.push({
          id: category.id,
          name: category.name, // Keep original casing for display
          _count: {
            items: category._count.items
          }
        })
      }
      
      return acc
    }, [] as any[])

    return NextResponse.json({ categories: aggregatedCategories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
