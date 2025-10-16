import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query, userLanguage = 'en' } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [], aiInterpretation: null })
    }

    // Get user's household
    const user = await prisma.user.findUnique({
      where: { id: (session?.user as any)?.id },
      include: {
        householdMemberships: {
          include: {
            household: true
          }
        }
      }
    })

    if (!user || !user.householdMemberships.length) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    const householdId = user.householdMemberships[0].household.id

    // Get all items in the household for context
    const allItems = await prisma.item.findMany({
      where: { householdId },
      include: {
        category: { include: { parent: true } },
        room: true,
        cabinet: true
      },
      take: 100 // Limit for performance
    })

    // Create context for AI
    const itemContext = allItems.map(item => ({
      name: item.name,
      description: item.description,
      category: item.category?.name,
      room: item.room?.name,
      cabinet: item.cabinet?.name,
      quantity: item.quantity
    }))

    let aiInterpretation = null
    let searchTerms = [query.trim()]

    // Use ChatGPT to interpret the natural language query
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a smart inventory search assistant. The user is searching through their inventory with the query: "${query}".

Available items context:
${JSON.stringify(itemContext, null, 2)}

Your task is to:
1. Interpret what the user is looking for
2. Suggest relevant search terms based on the available items
3. Provide a natural language interpretation of what they're searching for

Respond in JSON format with:
{
  "interpretation": "Natural language interpretation of what the user is looking for",
  "searchTerms": ["term1", "term2", "term3"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Be specific and helpful. If they're looking for something specific, suggest related terms.`
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        })

        const aiResponse = response.choices[0]?.message?.content
        if (aiResponse) {
          try {
            const parsed = JSON.parse(aiResponse)
            aiInterpretation = parsed.interpretation
            if (parsed.searchTerms && Array.isArray(parsed.searchTerms)) {
              searchTerms = parsed.searchTerms
            }
          } catch (parseError) {
            console.warn('Failed to parse AI response:', parseError)
          }
        }
      } catch (aiError) {
        console.warn('ChatGPT search interpretation failed:', aiError)
        // Continue with regular search
      }
    }

    // Perform search with AI-suggested terms
    const allResults = []
    
    for (const term of searchTerms) {
      const items = await prisma.item.findMany({
        where: {
          householdId,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { category: { name: { contains: term, mode: 'insensitive' } } },
            { room: { name: { contains: term, mode: 'insensitive' } } },
            { cabinet: { name: { contains: term, mode: 'insensitive' } } }
          ]
        },
        include: {
          category: { include: { parent: true } },
          room: true,
          cabinet: true
        },
        take: 20
      })
      
      allResults.push(...items)
    }

    // Remove duplicates and format results
    const uniqueItems = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    )

    const results = uniqueItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      imageUrl: item.imageUrl,
      category: item.category ? {
        id: item.category.id,
        name: item.category.name,
        parent: item.category.parent ? {
          name: item.category.parent.name
        } : undefined
      } : undefined,
      room: item.room ? {
        id: item.room.id,
        name: item.room.name
      } : undefined,
      cabinet: item.cabinet ? {
        id: item.cabinet.id,
        name: item.cabinet.name
      } : undefined
    }))

    return NextResponse.json({ 
      results,
      aiInterpretation,
      searchTerms,
      totalResults: results.length
    })

  } catch (error) {
    console.error('ChatGPT search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
