import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Create the most basic Prisma client possible
  const { PrismaClient } = await import('@prisma/client')
  
  // Use the simplest possible configuration
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?prepared_statements=false&connection_limit=1'
      }
    }
  })

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
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Get all items with their relations - simplified query
    const items = await prisma.item.findMany({
      where: {
        householdId: household.id
      },
      include: {
        category: {
          include: {
            parent: true
          }
        },
        room: true,
        cabinet: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Simple grouping - just return the items as-is for now
    const result = items.map(item => ({
      ...item,
      itemIds: [item.id] // Track all item IDs for this group
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching grouped items (simple):', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to fetch grouped items',
        details: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
