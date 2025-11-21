import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Simple similarity calculation based on name and description
function calculateSimilarity(itemName: string, itemDescription: string, existingName: string, existingDescription?: string): number {
  const nameSimilarity = calculateStringSimilarity(itemName.toLowerCase(), existingName.toLowerCase())
  const descSimilarity = existingDescription 
    ? calculateStringSimilarity(itemDescription.toLowerCase(), existingDescription.toLowerCase())
    : 0
  
  // Weight name similarity more heavily
  return (nameSimilarity * 0.7) + (descSimilarity * 0.3)
}

function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0
  
  // Check if one string contains the other
  if (str1.includes(str2) || str2.includes(str1)) {
    return 0.8
  }
  
  // Simple word-based similarity
  const words1 = str1.split(/\s+/)
  const words2 = str2.split(/\s+/)
  
  const commonWords = words1.filter(word => words2.includes(word))
  const totalWords = new Set([...words1, ...words2]).size
  
  return commonWords.length / totalWords
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()

    const { name, description = '', householdId } = body

    if (!name || !householdId) {
      return NextResponse.json({ error: 'Name and household ID are required' }, { status: 400 })
    }

    // Get all items in the household
    const items = await prisma.item.findMany({
      where: {
        householdId: householdId
      },
      include: {
        category: {
          include: {
            parent: true
          }
        },
        room: true,
        cabinet: true
      }
    })

    // Calculate similarity for each item
    const similarItems = items
      .map(item => ({
        ...item,
        similarity: calculateSimilarity(
          name, 
          description, 
          item.name, 
          item.description || ''
        )
      }))
      .filter(item => item.similarity > 0.3) // Only items with >30% similarity
      .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
      .slice(0, 5) // Top 5 most similar

    return NextResponse.json(similarItems)
  } catch (error) {
    console.error('Error finding similar items:', error)
    return NextResponse.json({ error: 'Failed to find similar items' }, { status: 500 })
  }
}
