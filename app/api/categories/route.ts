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
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const userLanguage = searchParams.get('language') || (session.user as any)?.language || 'en'

    let household

    if (householdId) {
      // Use provided household ID if user has access
      household = await prisma.household.findFirst({
        where: {
          id: householdId,
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    } else {
      // Get user's first household
      household = await prisma.household.findFirst({
        where: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    }

    if (!household) {
      return NextResponse.json([])
    }

    const categories = await prisma.category.findMany({
      where: {
        householdId: household.id,
        level: 1 // Only get level 1 categories, children will be included via include
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
        { name: 'asc' }
      ]
    })

    // Translate category names using category-translations
    const { getNormalizedCategoryKey, getCategoryDisplayName } = await import('@/lib/category-translations')
    
    const translateCategory = (cat: any): any => {
      const normalizedKey = getNormalizedCategoryKey(cat.name)
      return {
        ...cat,
        name: getCategoryDisplayName(normalizedKey, userLanguage),
        originalName: cat.name,
        children: cat.children ? cat.children.map(translateCategory) : undefined
      }
    }
    
    const translatedCategories = categories.map(translateCategory)

    // Return all categories - let the frontend build the hierarchy
    // Add debug information for duplicate checking
    const nameCounts = translatedCategories.reduce((acc, category) => {
      const key = `${category.name}_${category.level}_${category.parentId || 'null'}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const duplicates = Object.entries(nameCounts)
      .filter(([_key, count]) => (count as number) > 1)
      .map(([key, count]) => ({ key, count: count as number }))

    return NextResponse.json({
      categories: translatedCategories,
      debug: {
        totalCategories: translatedCategories.length,
        nameCounts,
        duplicates,
        householdId: household.id,
        userLanguage
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
    const { name, description, level, parentId, householdId } = body

    // Resolve target household (explicit param preferred)
    let household = null as any
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
        }
      })
    }

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
    // Import translations to check for cross-language duplicates
    const { getTranslations } = await import('@/lib/translations')
    
    // Get all translations to check for cross-language duplicates
    const translations = {
      'en': getTranslations('en'),
      'zh-TW': getTranslations('zh-TW'),
      'zh': getTranslations('zh'),
      'ja': getTranslations('ja')
    }
    
    // Create a set of all possible names for this category across languages
    const allPossibleNames = new Set([name])
    
    // Add all translations of this name
    Object.values(translations).forEach(t => {
      // Check if this name matches any translation key
      if (t.categoryNameTranslations && t.categoryNameTranslations[name]) {
        allPossibleNames.add(t.categoryNameTranslations[name])
      }
      // Also check reverse mapping - if this name is a translation of an English name
      Object.entries(t.categoryNameTranslations || {}).forEach(([englishName, translatedName]) => {
        if (translatedName === name) {
          allPossibleNames.add(englishName)
        }
      })
    })
    
    // Also check against the default category translations from the translation keys
    // This ensures we catch cases where categories are created using the translation keys directly
    Object.entries(translations).forEach(([langCode, t]) => {
      // Check if the name matches any of the default category translation keys
      if (name === t.electronics) allPossibleNames.add('Electronics')
      if (name === t.tools) allPossibleNames.add('Tools')
      if (name === t.clothing) allPossibleNames.add('Clothing')
      if (name === t.books) allPossibleNames.add('Books')
      if (name === t.miscellaneous) allPossibleNames.add('Miscellaneous')
      if (name === t.kitchen) allPossibleNames.add('Kitchen')
      
      // Reverse check - if name is English, add all translations
      if (name === 'Electronics') allPossibleNames.add(t.electronics)
      if (name === 'Tools') allPossibleNames.add(t.tools)
      if (name === 'Clothing') allPossibleNames.add(t.clothing)
      if (name === 'Books') allPossibleNames.add(t.books)
      if (name === 'Miscellaneous') allPossibleNames.add(t.miscellaneous)
      if (name === 'Kitchen') allPossibleNames.add(t.kitchen)
    })
    
    // Debug logging
    console.log('Category duplicate check debug:', {
      newCategoryName: name,
      allPossibleNames: Array.from(allPossibleNames),
      translations: Object.entries(translations).map(([lang, t]) => ({
        language: lang,
        categoryNameTranslations: t.categoryNameTranslations
      }))
    })
    
    // Check for existing categories with any of these names
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: { in: Array.from(allPossibleNames) },
        householdId: household.id,
        level: level,
        parentId: parentId || null // Also check if it's under the same parent
      }
    })

    if (existingCategory) {
      const levelText = level === 1 ? 'main category' : level === 2 ? 'subcategory' : 'sub-subcategory'
      return NextResponse.json(
        { 
          error: `${levelText} with this name already exists (including translations)`,
          duplicateName: name,
          existingName: existingCategory.name,
          suggestion: `Consider using a different name or check if you meant to edit the existing "${existingCategory.name}" ${levelText}.`
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


