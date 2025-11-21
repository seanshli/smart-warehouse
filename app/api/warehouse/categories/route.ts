// 分類 API 路由
// 處理分類的查詢、創建、更新、刪除等操作，支援三級分類結構

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// GET 處理器：獲取分類列表（階層結構）
export async function GET(request: NextRequest) {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId') // 家庭 ID
    const userLanguage = searchParams.get('language') || (session.user as any)?.language || 'en' // 用戶語言

    let household

    if (householdId) {
      // 如果用戶有權限，使用提供的家庭 ID
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
      // 獲取用戶的第一個家庭
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
      return NextResponse.json([]) // 無家庭時返回空陣列
    }

    // 查詢分類列表（僅獲取一級分類，子分類通過 include 包含）
    const categories = await prisma.category.findMany({
      where: {
        householdId: household.id,
        level: 1 // 僅獲取一級分類，子分類將通過 include 包含
      },
      include: {
        children: {
          include: {
            children: true, // 包含第三級分類
            _count: {
              select: { items: true } // 物品數量
            }
          }
        },
        _count: {
          select: { items: true } // 一級分類的物品數量
        }
      },
      orderBy: [
        { name: 'asc' } // 按名稱升序排序
      ]
    })

    // 使用分類翻譯模組翻譯分類名稱
    const { getNormalizedCategoryKey, getCategoryDisplayName } = await import('@/lib/category-translations')
    
    const ensureCount = (node: any) => ({
      ...node,
      _count: node?._count?.items !== undefined ? node._count : { items: 0 }
    })

    const translateCategory = (cat: any): any => {
      const normalizedKey = getNormalizedCategoryKey(cat.name)
      const translatedName = getCategoryDisplayName(normalizedKey, userLanguage)

      // Ensure children array (do NOT dedupe here to preserve distinct trees like Drinkware vs 飲品)
      const rawChildren: any[] = Array.isArray(cat.children) ? cat.children : []

      // Translate and sanitize each child
      const translatedChildren = rawChildren.map(child => {
        const tChild = translateCategory(child)
        // Guard: keep parent-child consistency and cap level at 3
        tChild.level = Math.min((child.level ?? (cat.level ?? 1) + 1), 3)
        return ensureCount(tChild)
      })

      return ensureCount({
        ...cat,
        name: translatedName,
        originalName: cat.name,
        children: translatedChildren
      })
    }
    
    const translatedCategories = categories.map(translateCategory)

    // Defensive: remove self-cycles, enforce levels, and ensure counts
    const sanitizeLevels = (nodes: any[], level = 1, seen = new Set<string>()): any[] => {
      return nodes.map(n => {
        const id = String(n.id || `${n.name}-${level}`)
        if (seen.has(id)) {
          return ensureCount({ ...n, level, children: [] })
        }
        seen.add(id)
        const kids = Array.isArray(n.children) ? sanitizeLevels(n.children, Math.min(level + 1, 3), seen) : []
        return ensureCount({ ...n, level, children: kids })
      })
    }
    const safeTree = sanitizeLevels(translatedCategories)

    return NextResponse.json(safeTree)
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


