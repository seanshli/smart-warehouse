import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Create direct PostgreSQL connection to bypass Prisma entirely
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  })

  let client;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    client = await pool.connect()

    // Get user's household using direct SQL
    const householdQuery = `
      SELECT h.id, h.name 
      FROM households h 
      JOIN household_members hm ON h.id = hm.household_id 
      WHERE hm.user_id = $1 
      LIMIT 1
    `
    const householdResult = await client.query(householdQuery, [userId])

    if (householdResult.rows.length === 0) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const household = householdResult.rows[0]

    // Get items using direct SQL
    const itemsQuery = `
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
      WHERE i.household_id = $1
      ORDER BY i.name ASC
    `
    const itemsResult = await client.query(itemsQuery, [household.id])

    // Transform the results to match expected format
    const items = itemsResult.rows.map(item => ({
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
  } finally {
    if (client) {
      client.release()
    }
    await pool.end()
  }
}
