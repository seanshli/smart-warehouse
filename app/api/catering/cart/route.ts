import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

// Shopping cart stored in cookies (session-based)
// Format: { items: [{ menuItemId, quantity, unitPrice }] }

const CART_COOKIE_NAME = 'catering_cart'

// GET /api/catering/cart - Get current cart
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)
    
    if (!cartCookie) {
      return NextResponse.json({ items: [], total: 0 }, { 
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }

    try {
      const cart = JSON.parse(cartCookie.value)
      console.log(`[Cart API] Retrieved cart with ${cart.items?.length || 0} items, total: ${cart.total || 0}`)
      
      // Ensure cart has proper structure
      const validCart = {
        items: Array.isArray(cart.items) ? cart.items : [],
        total: typeof cart.total === 'number' ? cart.total : (cart.items || []).reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0),
      }
      
      return NextResponse.json(validCart, {
        headers: {
          'Content-Type': 'application/json',
        }
      })
    } catch (parseError) {
      console.error('[Cart API] Error parsing cart cookie:', parseError)
      console.error('[Cart API] Cookie value:', cartCookie.value?.substring(0, 200))
      // Clear invalid cookie
      cookieStore.delete(CART_COOKIE_NAME)
      return NextResponse.json({ items: [], total: 0 }, {
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }
  } catch (error) {
    console.error('[Cart API] Error fetching cart:', error)
    return NextResponse.json({ items: [], total: 0, error: 'Failed to fetch cart' }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }
}

// POST /api/catering/cart/add - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { menuItemId, quantity = 1, isVegetarian = false, spiceLevel = 'no' } = body

    if (!menuItemId) {
      return NextResponse.json(
        { error: 'menuItemId is required' },
        { status: 400 }
      )
    }

    // Validate spice level
    const validSpiceLevels = ['no', '1x pepper', '2x pepper', '3x pepper']
    if (spiceLevel && !validSpiceLevels.includes(spiceLevel)) {
      return NextResponse.json(
        { error: 'Invalid spice level. Must be: no, 1x pepper, 2x pepper, or 3x pepper' },
        { status: 400 }
      )
    }

    // Fetch menu item to get current price
    const { createPrismaClient } = await import('@/lib/prisma-factory')
    const prisma = createPrismaClient()
    const menuItem = await prisma.cateringMenuItem.findUnique({
      where: { id: menuItemId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!menuItem) {
      console.error(`[Cart API] Menu item not found: ${menuItemId}`)
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    console.log(`[Cart API] Adding item to cart: ${menuItem.name} (ID: ${menuItemId}), Category: ${menuItem.category?.name || 'N/A'}, isActive: ${menuItem.isActive}, quantityAvailable: ${menuItem.quantityAvailable}, requestedQuantity: ${quantity}`)

    if (!menuItem.isActive) {
      console.error(`[Cart API] Menu item is inactive: ${menuItem.name} (ID: ${menuItemId}), Category: ${menuItem.category?.name || 'N/A'}`)
      return NextResponse.json(
        { error: 'Menu item is not available' },
        { status: 400 }
      )
    }

    // Allow adding to cart even if quantityAvailable is 0 (for pre-orders or unlimited items)
    // Only check if quantityAvailable is explicitly set and insufficient
    if (menuItem.quantityAvailable > 0 && menuItem.quantityAvailable < quantity) {
      console.error(`[Cart API] Insufficient quantity: ${menuItem.name} (ID: ${menuItemId}), Category: ${menuItem.category?.name || 'N/A'}, available: ${menuItem.quantityAvailable}, requested: ${quantity}`)
      return NextResponse.json(
        { error: `Insufficient quantity available. Only ${menuItem.quantityAvailable} available.` },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)
    
    let cart: { items: any[]; total?: number } = { items: [] }
    if (cartCookie) {
      cart = JSON.parse(cartCookie.value)
    }

    // Check if item already in cart with same options
    // Items with different selection options are treated as separate items
    const existingIndex = cart.items.findIndex(
      (item: any) => 
        item.menuItemId === menuItemId &&
        item.isVegetarian === isVegetarian &&
        item.spiceLevel === spiceLevel
    )

    if (existingIndex >= 0) {
      // Update quantity
      cart.items[existingIndex].quantity += quantity
      cart.items[existingIndex].subtotal = 
        cart.items[existingIndex].quantity * cart.items[existingIndex].unitPrice
    } else {
      // Add new item
      cart.items.push({
        menuItemId,
        name: menuItem.name,
        imageUrl: menuItem.imageUrl,
        quantity,
        unitPrice: parseFloat(menuItem.cost.toString()),
        subtotal: parseFloat(menuItem.cost.toString()) * quantity,
        isVegetarian: isVegetarian || false,
        spiceLevel: spiceLevel || 'no',
      })
    }

    // Calculate total
    cart.total = cart.items.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0
    )

    // Save cart to cookie
    cookieStore.set(CART_COOKIE_NAME, JSON.stringify(cart), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/', // Ensure cookie is available for all paths
    })
    
    console.log(`[Cart API] Saved cart with ${cart.items.length} items, total: ${cart.total}`)

    return NextResponse.json(cart, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

// DELETE /api/catering/cart - Clear cart
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.delete(CART_COOKIE_NAME)

    return NextResponse.json({ message: 'Cart cleared', items: [], total: 0 })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}
