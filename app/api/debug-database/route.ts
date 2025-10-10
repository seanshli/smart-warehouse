import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Debug: Check user data
    const userQuery = 'SELECT id, email, name FROM users WHERE id = $1'
    const userResult = await client.query(userQuery, [userId])

    // Debug: Check all households
    const householdsQuery = 'SELECT id, name, description FROM households ORDER BY created_at DESC LIMIT 10'
    const householdsResult = await client.query(householdsQuery)

    // Debug: Check household members
    const membersQuery = 'SELECT * FROM household_members WHERE user_id = $1'
    const membersResult = await client.query(membersQuery, [userId])

    // Debug: Check items count
    const itemsCountQuery = 'SELECT COUNT(*) as total_items FROM items'
    const itemsCountResult = await client.query(itemsCountQuery)

    // Debug: Check rooms count
    const roomsCountQuery = 'SELECT COUNT(*) as total_rooms FROM rooms'
    const roomsCountResult = await client.query(roomsCountQuery)

    // Debug: Check categories count
    const categoriesCountQuery = 'SELECT COUNT(*) as total_categories FROM categories'
    const categoriesCountResult = await client.query(categoriesCountQuery)

    // Debug: Get schema info for items table
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'items' 
      ORDER BY ordinal_position
    `
    const schemaResult = await client.query(schemaQuery)

    // Debug: Get sample items
    const sampleItemsQuery = 'SELECT * FROM items LIMIT 5'
    const sampleItemsResult = await client.query(sampleItemsQuery)

    // Debug: Try to find user's household with items
    const userHouseholdQuery = `
      SELECT h.id as household_id, h.name as household_name, 
             COUNT(i.id) as item_count
      FROM households h 
      JOIN household_members hm ON h.id = hm.household_id 
      LEFT JOIN items i ON h.id = i.household_id
      WHERE hm.user_id = $1
      GROUP BY h.id, h.name
    `
    const userHouseholdResult = await client.query(userHouseholdQuery, [userId])

    return NextResponse.json({
      debug: {
        user: userResult.rows[0],
        totalHouseholds: householdsResult.rows.length,
        households: householdsResult.rows,
        userMemberships: membersResult.rows,
        totalItems: itemsCountResult.rows[0]?.total_items || 0,
        totalRooms: roomsCountResult.rows[0]?.total_rooms || 0,
        totalCategories: categoriesCountResult.rows[0]?.total_categories || 0,
        itemsTableSchema: schemaResult.rows,
        sampleItems: sampleItemsResult.rows,
        userHouseholdWithItems: userHouseholdResult.rows,
        userId: userId
      }
    })
  } catch (error) {
    console.error('Database debug error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Database debug failed',
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
