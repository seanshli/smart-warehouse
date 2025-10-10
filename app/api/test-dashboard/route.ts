import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    const userId = (session.user as any).id
    console.log('Testing dashboard API for user:', userId)

    // Test household lookup (same as working test)
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

    console.log('Household found:', household.id, household.name)

    // Test individual queries that dashboard uses
    const totalItems = await prisma.item.count({
      where: {
        householdId: household.id
      }
    })
    console.log('Total items count:', totalItems)

    const totalRooms = await prisma.room.count({
      where: {
        householdId: household.id
      }
    })
    console.log('Total rooms count:', totalRooms)

    const householdMembers = await prisma.householdMember.count({
      where: {
        householdId: household.id
      }
    })
    console.log('Household members count:', householdMembers)

    return NextResponse.json({
      success: true,
      userId: userId,
      householdId: household.id,
      householdName: household.name,
      totalItems,
      totalRooms,
      householdMembers,
      testPassed: true
    })

  } catch (error) {
    console.error('Dashboard test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Dashboard test failed',
        details: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    )
  }
}
