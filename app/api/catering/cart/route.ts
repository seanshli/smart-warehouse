import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Ensure Node.js runtime

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
    console.log(`[Cart API GET] Cookie value (first 300 chars):`, cartCookie.value.substring(0, 300))
    console.log(`[Cart API GET] Cookie value starts with % (URL-encoded):`, cartCookie.value.startsWith('%'))
    console.log(`[Cart API GET] Cookie value contains %:`, cartCookie.value.includes('%'))

    try {
      // Decode URL-encoded cookie value if needed (Safari sometimes URL-encodes)
      let cookieValue = cartCookie.value
      
      // Next.js cookies() should automatically decode, but Safari might double-encode
      // Try to decode URL-encoded value
      if (cookieValue.includes('%')) {
        try {
          // Try decoding
          const decoded = decodeURIComponent(cookieValue)
          console.log(`[Cart API GET] Successfully decoded URL-encoded cookie`)
          console.log(`[Cart API GET] Decoded value (first 300 chars):`, decoded.substring(0, 300))
          cookieValue = decoded
        } catch (decodeError: any) {
          console.warn('[Cart API GET] Failed to decode URL-encoded cookie:', decodeError.message)
          console.warn('[Cart API GET] Using cookie value as-is (might be double-encoded)')
          // If decode fails, try using the value as-is - it might already be decoded
        }
      }
      
      // Try parsing JSON
      let cart: any
      try {
        cart = JSON.parse(cookieValue)
        console.log(`[Cart API GET] Successfully parsed cart JSON, items count:`, cart.items?.length || 0)
      } catch (parseError: any) {
        console.error('[Cart API GET] JSON parse error:', parseError.message)
        console.error('[Cart API GET] Cookie value that failed to parse (first 500 chars):', cookieValue.substring(0, 500))
        // Try one more decode if parse fails
        if (cookieValue !== cartCookie.value) {
          // Already tried decoding, parse failed - cookie might be corrupted
          throw parseError
        } else {
          // Try decoding again
          try {
            const doubleDecoded = decodeURIComponent(cookieValue)
            cart = JSON.parse(doubleDecoded)
            console.log(`[Cart API GET] Successfully parsed after double-decode`)
          } catch (doubleDecodeError) {
            throw parseError // Throw original parse error
          }
        }
      }
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
  console.log('[Cart API POST] ===== POST request received =====')
  console.log('[Cart API POST] Timestamp:', new Date().toISOString())
  console.log('[Cart API POST] Request URL:', request.url)
  console.log('[Cart API POST] Request method:', request.method)
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.error('[Cart API POST] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cart API POST] Session found for:', session.user.email)
    
    let body: any
    try {
      body = await request.json()
      console.log('[Cart API POST] Request body parsed:', { 
        menuItemId: body.menuItemId, 
        quantity: body.quantity,
        hasMenuId: !!body.menuItemId 
      })
    } catch (jsonError: any) {
      console.error('[Cart API POST] Error parsing request body:', jsonError)
      return NextResponse.json({ error: 'Invalid JSON in request body', details: jsonError.message }, { status: 400 })
    }
    
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
    // Fetch menu item with category
    // Try to include parent category info, but handle gracefully if columns don't exist
    let menuItem: any
    try {
      menuItem = await prisma.cateringMenuItem.findUnique({
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
      
      // Try to fetch parent category info if it exists (for subcategories)
      if (menuItem?.category) {
        try {
          const categoryWithParent = await (prisma as any).cateringCategory.findUnique({
            where: { id: menuItem.category.id },
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
          })
          if (categoryWithParent) {
            menuItem.category = categoryWithParent
          }
        } catch (parentError: any) {
          // If parentId/level columns don't exist, that's okay - just use basic category
          if (parentError.code !== 'P2021' && !parentError.message?.includes('does not exist')) {
            console.warn('[Cart API] Error fetching parent category (non-critical):', parentError.message)
          }
        }
      }
    } catch (queryError: any) {
      console.error('[Cart API POST] Error fetching menu item:', queryError)
      console.error('[Cart API POST] Error details:', {
        code: queryError.code,
        message: queryError.message,
        meta: queryError.meta,
      })
      
      // If it's a schema error, try a simpler query
      if (queryError.code === 'P2021' || queryError.message?.includes('does not exist')) {
        console.log('[Cart API POST] Schema error detected, trying simpler query...')
        try {
          menuItem = await prisma.cateringMenuItem.findUnique({
            where: { id: menuItemId },
          })
          console.log('[Cart API POST] Simpler query succeeded, menuItem found:', menuItem ? 'yes' : 'no')
        } catch (simpleQueryError: any) {
          console.error('[Cart API POST] Simpler query also failed:', simpleQueryError)
          return NextResponse.json(
            { 
              error: 'Database schema error. Please check if catering_menu_items table exists and has required columns.',
              details: simpleQueryError.message 
            },
            { status: 500 }
          )
        }
      } else {
        // Return 500 instead of throwing to avoid 405
        console.error('[Cart API POST] Non-schema error, returning 500')
        return NextResponse.json(
          { 
            error: 'Failed to fetch menu item',
            details: queryError.message 
          },
          { status: 500 }
        )
      }
    }

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
    
    // Initialize cart - start with empty, but preserve existing cart if cookie exists
    let cart: { items: any[]; total?: number } = { items: [] }
    if (cartCookie && cartCookie.value) {
      try {
        // Decode URL-encoded cookie value if needed (Safari sometimes URL-encodes)
        let cookieValue = cartCookie.value
        // Check if it's URL-encoded (starts with %)
        if (cookieValue.startsWith('%')) {
          try {
            cookieValue = decodeURIComponent(cookieValue)
          } catch (decodeError) {
            console.warn('[Cart API] Failed to decode URL-encoded cookie, using as-is:', decodeError)
          }
        }
        const parsedCart = JSON.parse(cookieValue)
        if (parsedCart && typeof parsedCart === 'object' && Array.isArray(parsedCart.items)) {
          cart = parsedCart
          console.log(`[Cart API] Loaded existing cart with ${cart.items.length} items`)
        } else {
          console.warn('[Cart API] Invalid cart structure in cookie, starting fresh')
        }
      } catch (parseError) {
        console.error('[Cart API] Error parsing existing cart cookie:', parseError)
        console.error('[Cart API] Cookie value (first 200 chars):', cartCookie.value?.substring(0, 200))
        // Start with empty cart if parsing fails
        cart = { items: [] }
      }
    } else {
      console.log('[Cart API] No existing cart cookie found, starting fresh')
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

    // Set cookie FIRST before creating response (critical for Next.js App Router)
    // In Next.js App Router, cookies must be set on the response object
    const sameSiteValue = 'lax' // Safari-compatible
    
    console.log(`[Cart API POST] About to set cookie: ${CART_COOKIE_NAME}`)
    console.log(`[Cart API POST] Cart JSON to save:`, cartJson.substring(0, 200))
    console.log(`[Cart API POST] Cart has ${cart.items.length} items`)
    
    // Create response first
    const response = NextResponse.json(cart, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
    
    // Set cookie via response.cookies (Next.js App Router way - this is the correct method)
    // Don't URL-encode here - Next.js handles encoding automatically
    response.cookies.set(CART_COOKIE_NAME, cartJson, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: sameSiteValue,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    
    // Verify Set-Cookie header was added
    const setCookieHeader = response.headers.get('Set-Cookie')
    console.log(`[Cart API POST] Set-Cookie header present:`, setCookieHeader ? 'yes' : 'no')
    if (setCookieHeader) {
      console.log(`[Cart API POST] Set-Cookie header value (first 300 chars):`, setCookieHeader.substring(0, 300))
      console.log(`[Cart API POST] Set-Cookie header contains cookie name:`, setCookieHeader.includes(CART_COOKIE_NAME))
    } else {
      console.error(`[Cart API POST] ERROR: Set-Cookie header is MISSING!`)
    }
    
    // Also verify via getAll() to see all cookies being set
    const allSetCookies = response.cookies.getAll()
    console.log(`[Cart API POST] All cookies being set:`, allSetCookies.map(c => c.name).join(', '))
    const ourCookie = allSetCookies.find(c => c.name === CART_COOKIE_NAME)
    if (ourCookie) {
      console.log(`[Cart API POST] Our cookie found in getAll(), value length:`, ourCookie.value.length)
    } else {
      console.error(`[Cart API POST] ERROR: Our cookie NOT found in getAll()!`)
    }
    
    // Verify cookie was set on response
    const verifyCookie = response.cookies.get(CART_COOKIE_NAME)
    if (verifyCookie) {
      console.log(`[Cart API POST] Cookie verified on response: ${verifyCookie.value.substring(0, 50)}...`)
      console.log(`[Cart API POST] Cookie value length: ${verifyCookie.value.length} bytes`)
    } else {
      console.error(`[Cart API POST] ERROR: Cookie NOT found on response after setting!`)
    }
    
    console.log(`[Cart API POST] Cookie set on response: ${CART_COOKIE_NAME}, length: ${cartJson.length} bytes`)
    console.log(`[Cart API POST] Cookie settings: httpOnly=true, secure=${process.env.NODE_ENV === 'production'}, sameSite=${sameSiteValue}, path=/`)
    
    // CRITICAL: Don't use cookieStore.set() here - it can interfere with response.cookies
    // The response.cookies.set() above is sufficient and correct for Next.js App Router
    // Using cookieStore.set() here might cause conflicts or overwrite issues
    
    console.log('[Cart API POST] Successfully returning response with cart, items:', cart.items.length)
    return response
  } catch (error: any) {
    console.error('[Cart API POST] Error adding to cart:', error)
    console.error('[Cart API POST] Error type:', error?.constructor?.name)
    console.error('[Cart API POST] Error details:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack?.substring(0, 500),
    })
    
    // Check if it's a Prisma error related to missing columns or relations
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.error('[Cart API POST] Database schema error - table or column missing')
      return NextResponse.json(
        { 
          error: 'Database schema error. Please check if migrations are up to date.',
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    // Check if it's a relation error
    if (error?.code === 'P2016' || error?.message?.includes('relation')) {
      console.error('[Cart API POST] Database relation error')
      return NextResponse.json(
        { 
          error: 'Database relation error. Please check category relationships.',
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    // Check if it's a JSON parsing error
    if (error?.name === 'SyntaxError' || error?.message?.includes('JSON')) {
      console.error('[Cart API POST] JSON parsing error')
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.message 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to add item to cart',
        details: error?.stack?.substring(0, 200) 
      },
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
