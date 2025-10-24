import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Find duplicate categories using similarity matching
    const categories = await prisma.category.findMany({
      include: {
        items: true,
        children: true
      }
    })

    const duplicates = new Map<string, any[]>()
    const removedCount = 0

    // Group categories by similarity
    for (const category of categories) {
      const normalizedName = category.name.toLowerCase().trim()
      
      // Check for exact matches first
      if (duplicates.has(normalizedName)) {
        duplicates.get(normalizedName)!.push(category)
      } else {
        // Check for similar names (different languages)
        let foundSimilar = false
        for (const [key, group] of Array.from(duplicates.entries())) {
          if (isSimilarCategory(normalizedName, key)) {
            group.push(category)
            foundSimilar = true
            break
          }
        }
        
        if (!foundSimilar) {
          duplicates.set(normalizedName, [category])
        }
      }
    }

    // Process duplicates - keep the one with most items, remove others
    for (const [key, group] of Array.from(duplicates.entries())) {
      if (group.length > 1) {
        // Sort by item count (descending) and creation date (ascending)
        group.sort((a: any, b: any) => {
          if (b.items.length !== a.items.length) {
            return b.items.length - a.items.length
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })

        const keepCategory = group[0] // Keep the one with most items (or oldest if tied)
        const removeCategories = group.slice(1)

        // Move items from removed categories to the kept category
        for (const removeCategory of removeCategories) {
          if (removeCategory.items.length > 0) {
            await prisma.item.updateMany({
              where: { categoryId: removeCategory.id },
              data: { categoryId: keepCategory.id }
            })
          }

          // Move children to the kept category
          if (removeCategory.children.length > 0) {
            await prisma.category.updateMany({
              where: { parentId: removeCategory.id },
              data: { parentId: keepCategory.id }
            })
          }

          // Delete the duplicate category
          await prisma.category.delete({
            where: { id: removeCategory.id }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      removedCount: removedCount,
      message: 'Duplicate categories cleaned up successfully'
    })

  } catch (error) {
    console.error('Error cleaning up duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function isSimilarCategory(name1: string, name2: string): boolean {
  // Check for common translations
  const translations = {
    'clothing': ['服裝', '衣服', 'clothes', 'garment'],
    'electronics': ['電子產品', '電器', 'electronic'],
    'kitchen': ['廚房用品', '廚具', 'kitchenware'],
    'food': ['食物', '食品', 'food'],
    'tools': ['工具', 'tool'],
    'miscellaneous': ['雜項', '其他', 'misc']
  }

  // Check if names are translations of each other
  for (const [english, translations_list] of Object.entries(translations)) {
    if ((name1 === english && translations_list.includes(name2)) ||
        (name2 === english && translations_list.includes(name1)) ||
        (translations_list.includes(name1) && translations_list.includes(name2))) {
      return true
    }
  }

  // Check for Levenshtein distance (simple similarity)
  const distance = levenshteinDistance(name1, name2)
  const maxLength = Math.max(name1.length, name2.length)
  const similarity = 1 - (distance / maxLength)
  
  return similarity > 0.8 // 80% similarity threshold
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}
