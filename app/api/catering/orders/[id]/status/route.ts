import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

export const dynamic = 'force-dynamic'

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

    // Valid status transitions based on workflow
    const validStatuses = ['submitted', 'accepted', 'preparing', 'ready', 'delivered', 'closed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current order
    const order = await prisma.cateringOrder.findUnique({
      where: { id: params.id },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Prepare update data with timestamps
    const updateData: any = { status }
    
    // Set appropriate timestamps based on status
    if (status === 'accepted' && !order.confirmedAt) {
      updateData.confirmedAt = new Date()
    } else if (status === 'preparing' && !order.preparedAt) {
      updateData.preparedAt = new Date()
    } else if (status === 'delivered' && !order.deliveredAt) {
      updateData.deliveredAt = new Date()
    } else if (status === 'cancelled' && !order.cancelledAt) {
      updateData.cancelledAt = new Date()
    }

    const updatedOrder = await prisma.cateringOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        household: {
          select: { id: true, name: true },
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
