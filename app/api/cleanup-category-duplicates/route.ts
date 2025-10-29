import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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
      },
      include: {
        categories: {
          include: {
            items: true,
            children: true
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    console.log(`🧹 Starting category cleanup for household: ${household.name}`)
    console.log(`📋 Found ${household.categories.length} categories`)
    console.log('Categories:', household.categories.map(c => ({ name: c.name, id: c.id, createdAt: c.createdAt })))

    // Group categories by their cross-language equivalents
    const categoryGroups = new Map<string, any[]>()
    
    for (const category of household.categories) {
      // Create a normalized key for cross-language matching
      let normalizedKey = category.name.toLowerCase()
      
      // Map Chinese names to English equivalents for grouping
      const chineseToEnglish: Record<string, string> = {
        '書籍': 'books',
        '服裝': 'clothing',
        '衣服': 'clothing',
        '電子產品': 'electronics',
        '廚房': 'kitchen',
        '其他': 'miscellaneous',
        '工具': 'tools',
        '上衣': 'shirts',
        't-shirt': 'shirts',
        '食物': 'food',
        'food': 'food',
        '雜項': 'miscellaneous',
        '廚房用品': 'kitchenware',
        '飲具': 'drinkware',
        '飲料': 'beverages',
        '配件': 'accessory',
        '書本': 'book',
        '服飾': 'clothes',
        '電子': 'electronics',
        '廚房用具': 'kitchenware',
        '雜物': 'miscellaneous',
        '器具': 'tools'
      }
      
      // If it's a Chinese name, normalize to English equivalent
      if (chineseToEnglish[category.name]) {
        normalizedKey = chineseToEnglish[category.name]
      }
      
      if (!categoryGroups.has(normalizedKey)) {
        categoryGroups.set(normalizedKey, [])
      }
      categoryGroups.get(normalizedKey)!.push(category)
    }
    
    const cleanupResults: any[] = []
    
    console.log('Category groups:', Array.from(categoryGroups.entries()).map(([key, cats]) => ({
      key,
      count: cats.length,
      categories: cats.map(c => c.name)
    })))
    
    // Find and clean up duplicates
    for (const [normalizedKey, categories] of Array.from(categoryGroups.entries())) {
      if (categories.length > 1) {
        console.log(`🔄 Found ${categories.length} duplicate categories for "${normalizedKey}":`)
        categories.forEach((category: any) => console.log(`  - "${category.name}" (ID: ${category.id}, Created: ${category.createdAt})`))
        
        // Sort by creation date - keep the oldest one
        categories.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        const keepCategory = categories[0]
        const deleteCategories = categories.slice(1)
        
        console.log(`  ✅ Keeping: "${keepCategory.name}" (oldest)`)
        
        const deletedCategories = []
        
        for (const categoryToDelete of deleteCategories) {
          console.log(`  🗑️  Deleting: "${categoryToDelete.name}"`)
          
          // Count items to be moved
          const itemCount = categoryToDelete.items.length
          const childCount = categoryToDelete.children.length
          
          // Move items from deleted category to kept category
          if (itemCount > 0) {
            await prisma.item.updateMany({
              where: { categoryId: categoryToDelete.id },
              data: { categoryId: keepCategory.id }
            })
          }
          
          // Move child categories from deleted category to kept category
          if (childCount > 0) {
            await prisma.category.updateMany({
              where: { parentId: categoryToDelete.id },
              data: { parentId: keepCategory.id }
            })
          }
          
          // Delete the category (items and children have been moved)
          await prisma.category.delete({
            where: { id: categoryToDelete.id }
          })
          
          deletedCategories.push({
            name: categoryToDelete.name,
            id: categoryToDelete.id,
            itemsMoved: itemCount,
            childrenMoved: childCount
          })
        }
        
        cleanupResults.push({
          normalizedKey,
          kept: keepCategory.name,
          deleted: deletedCategories
        })
      }
    }
    
    // Get final category counts
    const finalHousehold = await prisma.household.findFirst({
      where: { id: household.id },
      include: {
        categories: true
      }
    })
    
    const finalCategoryCounts = finalHousehold?.categories.reduce((acc, category) => {
      acc[category.name] = (acc[category.name] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    console.log('✅ Category cleanup completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Duplicate categories cleaned up successfully',
      cleanupResults,
      beforeCount: household.categories.length,
      afterCount: finalHousehold?.categories.length || 0,
      finalCategoryCounts,
      householdId: household.id
    })
    
  } catch (error) {
    console.error('❌ Error during category cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup category duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

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
      },
      include: {
        categories: true
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    // Group categories by their cross-language equivalents
    const categoryGroups = new Map<string, any[]>()
    
    for (const category of household.categories) {
      // Create a normalized key for cross-language matching
      let normalizedKey = category.name.toLowerCase()
      
      // Map Chinese names to English equivalents for grouping
      const chineseToEnglish: Record<string, string> = {
        '書籍': 'books',
        '服裝': 'clothing',
        '衣服': 'clothing',
        '電子產品': 'electronics',
        '廚房': 'kitchen',
        '其他': 'miscellaneous',
        '工具': 'tools',
        '上衣': 'shirts',
        't-shirt': 'shirts',
        '食物': 'food',
        'food': 'food',
        '雜項': 'miscellaneous',
        '廚房用品': 'kitchenware',
        '飲具': 'drinkware',
        '飲料': 'beverages',
        '配件': 'accessory',
        '書本': 'book',
        '服飾': 'clothes',
        '電子': 'electronics',
        '廚房用具': 'kitchenware',
        '雜物': 'miscellaneous',
        '器具': 'tools'
      }
      
      // If it's a Chinese name, normalize to English equivalent
      if (chineseToEnglish[category.name]) {
        normalizedKey = chineseToEnglish[category.name]
      }
      
      if (!categoryGroups.has(normalizedKey)) {
        categoryGroups.set(normalizedKey, [])
      }
      categoryGroups.get(normalizedKey)!.push(category)
    }
    
    // Find duplicates
    const duplicates: any[] = []
    for (const [normalizedKey, categories] of Array.from(categoryGroups.entries())) {
      if (categories.length > 1) {
        categories.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        duplicates.push({
          normalizedKey,
          categories: categories.map((category: any) => ({
            id: category.id,
            name: category.name,
            level: category.level,
            createdAt: category.createdAt,
            willKeep: category === categories[0]
          }))
        })
      }
    }
    
    return NextResponse.json({
      householdId: household.id,
      totalCategories: household.categories.length,
      duplicates,
      categoryCounts: household.categories.reduce((acc, category) => {
        acc[category.name] = (acc[category.name] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    })
    
  } catch (error) {
    console.error('❌ Error checking category duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to check category duplicates' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
