import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'
import { cookies } from 'next/headers'

const CART_COOKIE_NAME = 'catering_cart'

// GET /api/catering/orders - Get orders for current household
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = createPrismaClient()
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const status = searchParams.get('status')
    const isAdmin = searchParams.get('admin') === 'true' && user.isAdmin

    if (isAdmin) {
      // Admin can see all orders
      const orders = await prisma.cateringOrder.findMany({
        where: status ? { status } : undefined,
        include: {
          household: {
            select: { id: true, name: true, building: { select: { name: true } } },
          },
          orderedBy: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: {
              menuItem: {
                select: { id: true, name: true, imageUrl: true },
              },
            },
          },
        },
        orderBy: { orderedAt: 'desc' },
        take: 100,
      })

      return NextResponse.json({ orders })
    }

    // Regular users can only see their household's orders
    if (!householdId) {
      return NextResponse.json(
        { error: 'householdId is required' },
        { status: 400 }
      )
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: user.id,
          householdId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orders = await prisma.cateringOrder.findMany({
      where: {
        householdId,
        ...(status ? { status } : {}),
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
      },
      orderBy: { orderedAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/catering/orders - Place order (checkout)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = createPrismaClient()
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { householdId, deliveryType, scheduledTime, notes } = body

    if (!householdId) {
      return NextResponse.json(
        { error: 'householdId is required' },
        { status: 400 }
      )
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: user.id,
          householdId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get cart from cookie
    const cookieStore = await cookies()
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)
    
    if (!cartCookie) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    const cart = JSON.parse(cartCookie.value)
    
    if (!cart.items || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Validate delivery type
    if (deliveryType === 'scheduled' && !scheduledTime) {
      return NextResponse.json(
        { error: 'scheduledTime is required for scheduled delivery' },
        { status: 400 }
      )
    }

    if (deliveryType === 'scheduled') {
      const scheduled = new Date(scheduledTime)
      if (scheduled < new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time cannot be in the past' },
          { status: 400 }
        )
      }
    }

    // Validate cart items and check availability
    for (const item of cart.items) {
      const menuItem = await prisma.cateringMenuItem.findUnique({
        where: { id: item.menuItemId },
      })

      if (!menuItem) {
        return NextResponse.json(
          { error: `Menu item ${item.menuItemId} not found` },
          { status: 404 }
        )
      }

      if (!menuItem.isActive) {
        return NextResponse.json(
          { error: `Menu item ${menuItem.name} is no longer available` },
          { status: 400 }
        )
      }

      if (menuItem.quantityAvailable < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient quantity for ${menuItem.name}` },
          { status: 400 }
        )
      }
    }

    // Generate order number
    const year = new Date().getFullYear()
    const lastOrder = await prisma.cateringOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: `ORD-${year}-`,
        },
      },
      orderBy: { orderNumber: 'desc' },
    })

    let seqNum = 1
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.split('-')[2])
      seqNum = lastSeq + 1
    }

    const orderNumber = `ORD-${year}-${seqNum.toString().padStart(6, '0')}`

    // Validate cart total
    const calculatedTotal = cart.items.reduce(
      (sum: number, item: any) => sum + (item.subtotal || 0),
      0
    )
    
    if (Math.abs(calculatedTotal - (cart.total || 0)) > 0.01) {
      console.warn('Cart total mismatch:', { calculated: calculatedTotal, cart: cart.total })
    }
    
    const finalTotal = calculatedTotal > 0 ? calculatedTotal : (cart.total || 0)
    
    // Create order with items
    const order = await prisma.cateringOrder.create({
      data: {
        householdId,
        orderedById: user.id,
        orderNumber,
        deliveryType: deliveryType || 'immediate',
        scheduledTime: deliveryType === 'scheduled' ? new Date(scheduledTime) : null,
        totalAmount: finalTotal,
        status: 'pending', // Use 'pending' to match database constraint, will be updated to 'submitted' after constraint fix
        notes: notes || null,
        items: {
          create: cart.items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
      },
    })

    // Update menu item quantities
    for (const item of cart.items) {
      await prisma.cateringMenuItem.update({
        where: { id: item.menuItemId },
        data: {
          quantityAvailable: {
            decrement: item.quantity,
          },
        },
      })
    }

    // Clear cart
    cookieStore.delete(CART_COOKIE_NAME)

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Error placing order:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    })
    
    // Provide more specific error messages
    let errorMessage = 'Failed to place order'
    if (error?.code === 'P2002') {
      errorMessage = 'Order number conflict. Please try again.'
    } else if (error?.code === 'P2003') {
      errorMessage = 'Invalid reference. Please refresh and try again.'
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
      { status: 500 }
    )
  }
}
