import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    // Get user's household
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

    // Get a room and category for the demo items
    const roomQuery = 'SELECT id, name FROM rooms WHERE household_id = $1 LIMIT 1'
    const roomResult = await client.query(roomQuery, [household.id])
    
    const categoryQuery = 'SELECT id, name FROM categories WHERE household_id = $1 LIMIT 1'
    const categoryResult = await client.query(categoryQuery, [household.id])

    if (roomResult.rows.length === 0 || categoryResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'No rooms or categories found. Please create rooms and categories first.' 
      }, { status: 400 })
    }

    const room = roomResult.rows[0]
    const category = categoryResult.rows[0]

    // Create demo items
    const demoItems = [
      {
        name: 'White T-Shirt',
        description: 'Comfortable cotton t-shirt',
        quantity: 3,
        minQuantity: 1
      },
      {
        name: 'Blue Jeans',
        description: 'Classic blue denim jeans',
        quantity: 2,
        minQuantity: 1
      },
      {
        name: 'Running Shoes',
        description: 'Comfortable athletic shoes',
        quantity: 1,
        minQuantity: 0
      },
      {
        name: 'Coffee Mug',
        description: 'Ceramic coffee mug',
        quantity: 4,
        minQuantity: 2
      },
      {
        name: 'Laptop',
        description: 'Personal laptop computer',
        quantity: 1,
        minQuantity: 0
      }
    ]

    // Insert demo items
    const insertQuery = `
      INSERT INTO items (id, name, description, quantity, min_quantity, household_id, room_id, category_id, added_by_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    `

    const createdItems = []
    for (const item of demoItems) {
      const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(7)}`
      await client.query(insertQuery, [
        itemId,
        item.name,
        item.description,
        item.quantity,
        item.minQuantity,
        household.id,
        room.id,
        category.id,
        userId
      ])
      createdItems.push({ ...item, id: itemId })
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdItems.length} demo items`,
      household: household.name,
      room: room.name,
      category: category.name,
      items: createdItems
    })

  } catch (error) {
    console.error('Create demo items error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to create demo items',
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
