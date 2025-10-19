import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, adminRole: true }
    })

    if (!user?.isAdmin || (user.adminRole !== 'SUPERUSER' && user.adminRole !== 'ITEM_MANAGEMENT')) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const { itemName, description, category, householdId } = await request.json()

    if (!itemName || !householdId) {
      return NextResponse.json({ error: 'Item name and household ID are required' }, { status: 400 })
    }

    // Search for potential duplicates across all households
    const searchConditions: any[] = [
      {
        name: {
          contains: itemName,
          mode: 'insensitive'
        }
      },
      {
        name: {
          contains: itemName.split(' ')[0], // First word
          mode: 'insensitive'
        }
      }
    ]

    if (description) {
      searchConditions.push({
        description: {
          contains: description,
          mode: 'insensitive'
        }
      })
    }

    const potentialDuplicates = await prisma.item.findMany({
      where: {
        OR: searchConditions
      },
      include: {
        household: {
          select: { id: true, name: true }
        },
        room: {
          select: { id: true, name: true }
        },
        cabinet: {
          select: { id: true, name: true }
        },
        category: {
          select: { id: true, name: true, level: true }
        }
      }
    })

    // Calculate similarity scores
    const duplicatesWithScores = potentialDuplicates.map(item => {
      const nameSimilarity = calculateSimilarity(itemName.toLowerCase(), item.name.toLowerCase())
      const descSimilarity = description && item.description ? 
        calculateSimilarity(description.toLowerCase(), item.description.toLowerCase()) : 0
      
      const totalSimilarity = (nameSimilarity * 0.7) + (descSimilarity * 0.3)
      
      return {
        ...item,
        similarityScore: totalSimilarity,
        isDuplicate: totalSimilarity > 0.8 // 80% similarity threshold
      }
    })

    // Filter for high-confidence duplicates
    const highConfidenceDuplicates = duplicatesWithScores
      .filter(item => item.isDuplicate)
      .sort((a, b) => b.similarityScore - a.similarityScore)

    return NextResponse.json({
      hasDuplicates: highConfidenceDuplicates.length > 0,
      duplicates: highConfidenceDuplicates,
      allMatches: duplicatesWithScores,
      searchTerm: itemName,
      description: description
    })

  } catch (error) {
    console.error('Error in duplicate detection:', error)
    return NextResponse.json(
      { error: 'Failed to detect duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Levenshtein distance-based similarity calculation
function calculateSimilarity(str1: string, str2: string): number {
  const matrix = []
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return len2 === 0 ? 1 : 0
  if (len2 === 0) return 0

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
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

  const distance = matrix[len1][len2]
  const maxLen = Math.max(len1, len2)
  return 1 - (distance / maxLen)
}
