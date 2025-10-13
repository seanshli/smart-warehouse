import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Temporary: Use demo user if no session for testing
    let userId = (session?.user as any)?.id
    if (!userId) {
      console.log('No session found, using demo user for testing')
      // Get demo user ID
      const demoUser = await prisma.user.findUnique({
        where: { email: 'demo@smartwarehouse.com' }
      })
      if (demoUser) {
        userId = demoUser.id
      } else {
        return NextResponse.json({ error: 'Unauthorized - no demo user found' }, { status: 401 })
      }
    }

    console.log('Grouped-direct API: User ID:', userId)

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
      console.log('No household found for user:', userId)
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    console.log('Grouped-direct API: Household ID:', household.id)

    // Get items using Prisma
    const items = await prisma.item.findMany({
      where: {
        householdId: household.id
      },
      include: {
        category: true,
        room: true,
        cabinet: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('Grouped-direct API: Found', items.length, 'items')

    // Transform the results to match expected format
    const transformedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      barcode: item.barcode,
      imageUrl: item.imageUrl,
      householdId: item.householdId,
      categoryId: item.categoryId,
      roomId: item.roomId,
      cabinetId: item.cabinetId,
      category: item.category ? { name: item.category.name } : null,
      room: item.room ? { name: item.room.name } : null,
      cabinet: item.cabinet ? { name: item.cabinet.name } : null,
      itemIds: [item.id] // Track all item IDs for this group
    }))

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error('Error fetching grouped items (direct):', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to fetch grouped items',
        details: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    )
  }
}
