import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

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
    
    // Debug: List all cookies
    const allCookies = cookieStore.getAll()
    console.log(`[Cart API GET] All cookies:`, allCookies.map(c => c.name).join(', '))
    console.log(`[Cart API GET] Looking for cookie: ${CART_COOKIE_NAME}`)
    console.log(`[Cart API GET] Cookie exists in list:`, allCookies.some(c => c.name === CART_COOKIE_NAME))
    
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)
    
    if (!cartCookie) {
      console.log(`[Cart API GET] No cart cookie found. Cookie name: ${CART_COOKIE_NAME}`)
      return NextResponse.json({ items: [], total: 0 }, { 
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }
    
    console.log(`[Cart API GET] Found cart cookie, length: ${cartCookie.value.length} bytes`)

    try {
      const cart = JSON.parse(cartCookie.value)
      console.log(`[Cart API GET] Retrieved cart with ${cart.items?.length || 0} items, total: ${cart.total || 0}`)
      console.log(`[Cart API GET] Cart items:`, cart.items?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        menuItemId: item.menuItemId,
      })))
      
      // Ensure cart has proper structure
      const validCart = {
        items: Array.isArray(cart.items) ? cart.items : [],
        total: typeof cart.total === 'number' ? cart.total : (cart.items || []).reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0),
      }
      
      console.log(`[Cart API GET] Returning valid cart with ${validCart.items.length} items`)
      
      return NextResponse.json(validCart, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      })
    } catch (parseError) {
      console.error('[Cart API GET] Error parsing cart cookie:', parseError)
      console.error('[Cart API GET] Cookie value (first 500 chars):', cartCookie.value?.substring(0, 500))
      console.error('[Cart API GET] Cookie value length:', cartCookie.value?.length)
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

// POST /api/catering/cart - Add item to cart
// Note: This handles POST to /api/catering/cart (not /api/catering/cart/add)
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
    // Fetch menu item with category (including parent category for subcategories)
    const menuItem = await prisma.cateringMenuItem.findUnique({
      where: { id: menuItemId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            parentId: true,
            level: true,
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
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
    const cartJson = JSON.stringify(cart)
    
    console.log(`[Cart API] Saved cart with ${cart.items.length} items, total: ${cart.total}`)
    console.log(`[Cart API] Cart JSON length: ${cartJson.length} bytes`)
    console.log(`[Cart API] Cart items:`, cart.items.map((i: any) => ({
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
    })))

    // Create response first
    const response = NextResponse.json(cart, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
    
    // Set cookie on the response object (this is the correct way in Next.js App Router)
    response.cookies.set(CART_COOKIE_NAME, cartJson, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/', // Ensure cookie is available for all paths
    })
    
    // Also set via cookieStore for compatibility
    cookieStore.set(CART_COOKIE_NAME, cartJson, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    
    // Verify cookie was set
    const verifyCookie = cookieStore.get(CART_COOKIE_NAME)
    if (verifyCookie) {
      console.log(`[Cart API] Cookie verified: ${verifyCookie.value.substring(0, 100)}...`)
      console.log(`[Cart API] Cookie value length: ${verifyCookie.value.length} bytes`)
    } else {
      console.error(`[Cart API] WARNING: Cookie was not set!`)
    }
    
    return response
  } catch (error: any) {
    console.error('[Cart API] Error adding to cart:', error)
    console.error('[Cart API] Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.substring(0, 500),
    })
    
    // Check if it's a Prisma error related to missing columns or relations
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.error('[Cart API] Database schema error - table or column missing')
      return NextResponse.json(
        { error: 'Database schema error. Please check if migrations are up to date.' },
        { status: 500 }
      )
    }
    
    // Check if it's a relation error
    if (error?.code === 'P2016' || error?.message?.includes('relation')) {
      console.error('[Cart API] Database relation error')
      return NextResponse.json(
        { error: 'Database relation error. Please check category relationships.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to add item to cart' },
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
