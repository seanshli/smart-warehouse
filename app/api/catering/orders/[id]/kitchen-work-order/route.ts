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
    if (lastTicket && lastTicket.ticketNumber) {
      try {
        // Parse format: MT-YYYY#### or MT-YYYY-####
        const parts = lastTicket.ticketNumber.split('-')
        if (parts.length >= 2) {
          // Handle both MT-YYYY#### and MT-YYYY-#### formats
          const yearPart = parts[1]
          if (yearPart.length > 4) {
            // Format: MT-YYYY####
            const seqStr = yearPart.substring(4)
            const lastSeq = parseInt(seqStr) || 0
            seqNum = lastSeq + 1
          } else if (parts.length === 3) {
            // Format: MT-YYYY-####
            const seqStr = parts[2]
            const lastSeq = parseInt(seqStr) || 0
            seqNum = lastSeq + 1
          }
        }
      } catch (parseError) {
        console.error('[Kitchen Work Order] Error parsing ticket number:', parseError)
        // Fallback: just increment from 1
        seqNum = 1
      }
    }

    const ticketNumber = `MT-${year}${seqNum.toString().padStart(4, '0')}`

    // Create item list description
    const itemList = order.items.map(item => 
      `${item.menuItem.name} x${item.quantity}`
    ).join(', ')

    // Create kitchen work order
    let ticket
    try {
      ticket = await prisma.maintenanceTicket.create({
        data: {
          ticketNumber: ticketNumber || '', // Use generated number or empty for trigger
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
    } catch (createError: any) {
      console.error('[Kitchen Work Order] Error creating ticket:', createError)
      // If ticketNumber constraint fails, try with empty string (database trigger)
      if (createError.code === 'P2002' || createError.message?.includes('ticketNumber')) {
        console.log('[Kitchen Work Order] Retrying with empty ticketNumber for database trigger')
        ticket = await prisma.maintenanceTicket.create({
          data: {
            ticketNumber: '', // Let database trigger generate it
            householdId: order.householdId,
            requestedById: order.orderedById,
            title: `Kitchen Work Order: ${order.orderNumber}`,
            description: `Catering Order ${order.orderNumber}\n\nItems:\n${itemList}\n\nDelivery Type: ${order.deliveryType === 'scheduled' ? 'Scheduled' : 'Immediate'}${order.scheduledTime ? `\nScheduled Time: ${new Date(order.scheduledTime).toLocaleString()}` : ''}${order.notes ? `\n\nNotes: ${order.notes}` : ''}`,
            category: 'FOOD_ORDER',
            priority: 'NORMAL',
            status: 'ASSIGNED',
            routingType: 'INTERNAL_BUILDING',
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
      } else {
        throw createError
      }
    }

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
    console.error('[Kitchen Work Order] Error creating kitchen work order:', error)
    return NextResponse.json(
      { error: 'Failed to create kitchen work order', details: error.message, stack: error.stack },
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
