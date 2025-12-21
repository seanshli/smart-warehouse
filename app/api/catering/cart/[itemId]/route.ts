import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

const CART_COOKIE_NAME = 'catering_cart'

// PUT /api/catering/cart/[itemId] - Update item quantity in cart
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { quantity } = body

    if (quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)
    
    if (!cartCookie) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    const cart: { items: any[]; total?: number } = JSON.parse(cartCookie.value)
    const itemIndex = cart.items.findIndex(
      (item: any) => item.menuItemId === params.itemId
    )

    if (itemIndex < 0) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      )
    }

    if (quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1)
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity
      cart.items[itemIndex].subtotal = 
        cart.items[itemIndex].quantity * cart.items[itemIndex].unitPrice
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
    })

    return NextResponse.json(cart)
  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

// DELETE /api/catering/cart/[itemId] - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)
    
    if (!cartCookie) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    const cart: { items: any[]; total?: number } = JSON.parse(cartCookie.value)
    const itemIndex = cart.items.findIndex(
      (item: any) => item.menuItemId === params.itemId
    )

    if (itemIndex < 0) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      )
    }

    // Remove item
    cart.items.splice(itemIndex, 1)

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
    })

    return NextResponse.json(cart)
  } catch (error) {
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}
