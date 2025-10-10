import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Create the most basic Prisma client possible with no prepared statements
  const { PrismaClient } = await import('@prisma/client')
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?prepared_statements=false&connection_limit=1&sslmode=require'
      }
    }
  })

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Use raw SQL to avoid prepared statement conflicts
    const householdResult = await prisma.$queryRaw`
      SELECT h.id, h.name 
      FROM households h 
      JOIN household_members hm ON h.id = hm.household_id 
      WHERE hm.user_id = ${userId} 
      LIMIT 1
    `

    if (!householdResult || (householdResult as any[]).length === 0) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const household = (householdResult as any[])[0]

    // Get items using raw SQL to avoid column mapping issues
    const itemsResult = await prisma.$queryRaw`
      SELECT 
        i.id,
        i.name,
        i.description,
        i.quantity,
        i.min_quantity as "minQuantity",
        i.barcode,
        i.household_id as "householdId",
        i.category_id as "categoryId",
        i.room_id as "roomId",
        i.cabinet_id as "cabinetId",
        c.name as category_name,
        r.name as room_name,
        cb.name as cabinet_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN rooms r ON i.room_id = r.id
      LEFT JOIN cabinets cb ON i.cabinet_id = cb.id
      WHERE i.household_id = ${household.id}
      ORDER BY i.name ASC
    `

    // Transform the raw results to match expected format
    const items = (itemsResult as any[]).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      barcode: item.barcode,
      householdId: item.householdId,
      categoryId: item.categoryId,
      roomId: item.roomId,
      cabinetId: item.cabinetId,
      category: item.category_name ? { name: item.category_name } : null,
      room: item.room_name ? { name: item.room_name } : null,
      cabinet: item.cabinet_name ? { name: item.cabinet_name } : null,
      itemIds: [item.id] // Track all item IDs for this group
    }))

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching grouped items (raw):', error)
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
