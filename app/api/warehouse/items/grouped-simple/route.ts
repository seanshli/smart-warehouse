import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Create Prisma client with Prisma 7 adapter
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
  }

  const pool = new Pool({
    connectionString,
    max: 1,
  })

  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

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
    await pool.end()
  }
}
