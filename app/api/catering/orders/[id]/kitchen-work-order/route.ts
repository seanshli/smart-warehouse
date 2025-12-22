import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

export const dynamic = 'force-dynamic'

/**
 * POST /api/catering/orders/[id]/kitchen-work-order
 * Create a kitchen work order for a catering order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = createPrismaClient()
    const resolvedParams = params instanceof Promise ? await params : params
    const orderId = resolvedParams.id

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get catering order
    const order = await prisma.cateringOrder.findUnique({
      where: { id: orderId },
      include: {
        household: {
          include: {
            building: {
              include: {
                community: true,
              },
            },
          },
        },
        workgroup: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if work order already exists
    const existingTicket = await prisma.maintenanceTicket.findFirst({
      where: {
        householdId: order.householdId,
        category: 'FOOD_ORDER',
        description: {
          contains: order.orderNumber,
        },
      },
    })

    if (existingTicket) {
      return NextResponse.json({
        ticket: existingTicket,
        message: 'Kitchen work order already exists',
      }, { status: 200 })
    }

    // Generate ticket number (format: MT-YYYY####)
    const year = new Date().getFullYear()
    const lastTicket = await prisma.maintenanceTicket.findFirst({
      where: {
        ticketNumber: {
          startsWith: `MT-${year}`,
        },
      },
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    })

    let seqNum = 1
    if (lastTicket) {
      // Parse format: MT-YYYY####
      const parts = lastTicket.ticketNumber.split('-')
      if (parts.length === 2) {
        const seqStr = parts[1].substring(4) // Get part after year
        const lastSeq = parseInt(seqStr) || 0
        seqNum = lastSeq + 1
      }
    }

    const ticketNumber = `MT-${year}${seqNum.toString().padStart(4, '0')}`

    // Create item list description
    const itemList = order.items.map(item => 
      `${item.menuItem.name} x${item.quantity}`
    ).join(', ')

    // Create kitchen work order
    const ticket = await prisma.maintenanceTicket.create({
      data: {
        ticketNumber,
        householdId: order.householdId,
        requestedById: order.orderedById,
        title: `Kitchen Work Order: ${order.orderNumber}`,
        description: `Catering Order ${order.orderNumber}\n\nItems:\n${itemList}\n\nDelivery Type: ${order.deliveryType === 'scheduled' ? 'Scheduled' : 'Immediate'}${order.scheduledTime ? `\nScheduled Time: ${new Date(order.scheduledTime).toLocaleString()}` : ''}${order.notes ? `\n\nNotes: ${order.notes}` : ''}`,
        category: 'FOOD_ORDER',
        priority: 'NORMAL',
        status: 'ASSIGNED', // Start as assigned since order is already accepted
        routingType: 'INTERNAL_BUILDING',
        // Note: assignedCrewId is for WorkingCrew, not WorkingGroup
        // Kitchen work orders are assigned to workgroups via the catering order's workgroupId
        // The workgroup members will see this ticket in their assigned tickets
      },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            building: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Update order status to preparing if not already
    if (order.status === 'accepted') {
      await prisma.cateringOrder.update({
        where: { id: orderId },
        data: { status: 'preparing' },
      })
    }

    return NextResponse.json({
      ticket,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status === 'accepted' ? 'preparing' : order.status,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating kitchen work order:', error)
    return NextResponse.json(
      { error: 'Failed to create kitchen work order', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/catering/orders/[id]/kitchen-work-order
 * Get kitchen work order for a catering order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = createPrismaClient()
    const resolvedParams = params instanceof Promise ? await params : params
    const orderId = resolvedParams.id

    // Get catering order
    const order = await prisma.cateringOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        householdId: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Find associated work order
    const ticket = await prisma.maintenanceTicket.findFirst({
      where: {
        householdId: order.householdId,
        category: 'FOOD_ORDER',
        description: {
          contains: order.orderNumber,
        },
      },
      include: {
        assignedCrew: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        workLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    return NextResponse.json({ ticket: ticket || null })
  } catch (error: any) {
    console.error('Error fetching kitchen work order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch kitchen work order', details: error.message },
      { status: 500 }
    )
  }
}
