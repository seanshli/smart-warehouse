import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// PUT /api/catering/orders/[id]/cancel - Cancel order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const order = await prisma.cateringOrder.findUnique({
      where: { id: params.id },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check permissions
    if (!user.isAdmin) {
      // Verify user is member of household
      const membership = await prisma.householdMember.findUnique({
        where: {
          userId_householdId: {
            userId: user.id,
            householdId: order.householdId,
          },
        },
      })

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed']
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Order cannot be cancelled. Current status: ${order.status}` },
        { status: 400 }
      )
    }

    // Restore quantities
    for (const item of order.items) {
      await prisma.cateringMenuItem.update({
        where: { id: item.menuItemId },
        data: {
          quantityAvailable: {
            increment: item.quantity,
          },
        },
      })
    }

    // Update order status
    const cancelledOrder = await prisma.cateringOrder.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
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

    return NextResponse.json(cancelledOrder)
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
