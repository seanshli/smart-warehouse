import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Create the most basic Prisma client possible using Prisma 7 adapter
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
    console.log('Testing simple DB connection for user:', userId)

    // Test the most basic query possible
    const userCount = await prisma.user.count()
    console.log('User count:', userCount)

    // Test household lookup
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
      return NextResponse.json({
        success: false,
        userId: userId,
        householdFound: false,
        userCount: userCount,
        message: 'Household not found for user'
      })
    }

    // Test basic counts
    const [totalItems, totalRooms] = await Promise.all([
      prisma.item.count({
        where: {
          householdId: household.id
        }
      }),
      prisma.room.count({
        where: {
          householdId: household.id
        }
      })
    ])

    return NextResponse.json({
      success: true,
      userId: userId,
      householdFound: true,
      householdId: household.id,
      householdName: household.name,
      userCount: userCount,
      totalItems: totalItems,
      totalRooms: totalRooms
    })

  } catch (error) {
    console.error('Simple DB test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Simple DB test failed',
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
