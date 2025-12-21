import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// GET /api/catering/orders/[id] - Get single order details
export async function GET(
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
              select: { id: true, name: true, imageUrl: true, description: true },
            },
          },
        },
      },
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

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT /api/catering/orders/[id]/status - Update order status (admin only)
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

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    const validStatuses = ['submitted', 'accepted', 'preparing', 'ready', 'delivered', 'closed', 'cancelled', 'pending', 'confirmed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    const now = new Date()

    // Set appropriate timestamp based on status
    switch (status) {
      case 'accepted':
      case 'confirmed':
        if (!updateData.confirmedAt) {
          updateData.confirmedAt = now
        }
        break
      case 'preparing':
        if (!updateData.preparedAt) {
          updateData.preparedAt = now
        }
        break
      case 'delivered':
        if (!updateData.deliveredAt) {
          updateData.deliveredAt = now
        }
        break
      case 'cancelled':
        updateData.cancelledAt = now
        // Restore quantities
        const order = await prisma.cateringOrder.findUnique({
          where: { id: params.id },
          include: { items: true },
        })
        if (order) {
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
        }
        break
    }

    const updatedOrder = await prisma.cateringOrder.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
