import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const { searchParams } = new URL(request.url)
    const activeHouseholdId = searchParams.get('householdId')

    console.log('🚀 Simple Dashboard: Starting for household:', activeHouseholdId)

    // Get household
    let household
    if (activeHouseholdId) {
      household = await prisma.household.findFirst({
        where: {
          id: activeHouseholdId,
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    } else {
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
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    console.log('🚀 Simple Dashboard: Found household:', household.name)

    // Use raw SQL for maximum performance
    const startTime = Date.now()
    
    const [itemCount, roomCount, memberCount] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "items" WHERE "household_id" = ${household.id}`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "rooms" WHERE "household_id" = ${household.id}`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "household_members" WHERE "household_id" = ${household.id}`
    ])

    const queryTime = Date.now() - startTime
    console.log('🚀 Simple Dashboard: Queries completed in', queryTime, 'ms')

    const result = {
      totalItems: Number((itemCount as any)[0].count),
      totalRooms: Number((roomCount as any)[0].count),
      lowStockItems: 0, // Simplified - no complex calculation
      householdMembers: Number((memberCount as any)[0].count),
      recentActivities: [], // Simplified - no activities for now
      debug: {
        householdId: household.id,
        userId: userId,
        queryTime: `${queryTime}ms`
      }
    }

    console.log('🚀 Simple Dashboard: Returning result:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('🚀 Simple Dashboard: Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
