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
    const { name, description } = body

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

    // Verify category belongs to user's household
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        householdId: household.id
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 })
    }

    // Check for duplicate category name if name is being changed
    if (name && name !== category.name) {
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
      
      // Check for existing categories with any of these names
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: { in: Array.from(allPossibleNames) },
          householdId: household.id,
          level: category.level,
          parentId: category.parentId,
          id: { not: categoryId } // Exclude current category
        }
      })

      if (existingCategory) {
        const levelText = category.level === 1 ? 'main category' : category.level === 2 ? 'subcategory' : 'sub-subcategory'
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
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: {
        id: categoryId
      },
      data: {
        name: name,
        description: description
      }
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categoryId = params.id
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
      return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 })
    }

    // Check if category has items
    if (category._count.items > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It contains ${category._count.items} item(s). Please move or delete all items first.` },
        { status: 400 }
      )
    }

    // Check if category has children
    if (category._count.children > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It contains ${category._count.children} subcategory(ies). Please delete all subcategories first.` },
        { status: 400 }
      )
    }

    // Log category deletion before deleting
    try {
      // Find the category log item for this category
      const categoryLogItem = await prisma.item.findFirst({
        where: {
          name: `[CATEGORY] ${category.name}`,
          categoryId: categoryId,
          householdId: household.id
        }
      })

      if (categoryLogItem) {
      }
    } catch (logError) {
      console.error('Error logging category deletion:', logError)
      // Don't fail the request if logging fails
    }

    // Delete the category
    await prisma.category.delete({
      where: {
        id: categoryId
      }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
