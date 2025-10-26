import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getNormalizedCategoryKey, getCategoryDisplayName } from '@/lib/category-translations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get language from Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language') || 'en'
    const language = acceptLanguage.split(',')[0].split('-')[0] === 'zh' ? acceptLanguage : acceptLanguage.split(',')[0]

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

    // Aggregate categories by normalized key (cross-language)
    const aggregatedCategories = categories.reduce((acc, category) => {
      const normalizedKey = getNormalizedCategoryKey(category.name)
      const existingCategory = acc.find(cat => cat.normalizedKey === normalizedKey)
      
      if (existingCategory) {
        existingCategory._count.items += category._count.items
      } else {
        acc.push({
          id: category.id,
          name: getCategoryDisplayName(normalizedKey, language), // Use translated name
          normalizedKey: normalizedKey,
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
