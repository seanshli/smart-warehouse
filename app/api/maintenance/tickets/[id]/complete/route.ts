import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/maintenance/tickets/[id]/complete - Mark work as completed
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const ticketId = params.id

    // Get ticket and verify access
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: ticketId },
      include: {
        assignedCrew: {
          include: {
            members: {
              select: { userId: true }
            }
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user is assigned worker or crew member
    const isAssignedWorker = ticket.assignedWorkerId === userId
    const isCrewMember = ticket.assignedCrew?.members.some(m => m.userId === userId)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    if (!isAssignedWorker && !isCrewMember && !user?.isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update ticket status
    const updatedTicket = await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        status: 'WORK_COMPLETED',
        workCompletedAt: new Date()
      },
      include: {
        household: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // If this is a FOOD_ORDER ticket, sync with catering order status
    if (ticket.category === 'FOOD_ORDER' && ticket.description) {
      try {
        // Extract order number from description (format: "Catering Order ORD-2025-000003")
        const orderNumberMatch = ticket.description.match(/Order\s+([A-Z]+-\d+-\d+)/i)
        if (orderNumberMatch) {
          const orderNumber = orderNumberMatch[1]
          const cateringOrder = await prisma.cateringOrder.findUnique({
            where: { orderNumber },
          })
          
          if (cateringOrder && cateringOrder.status === 'preparing') {
            // Update catering order to "ready" when kitchen work is completed
            await prisma.cateringOrder.update({
              where: { id: cateringOrder.id },
              data: { status: 'ready' },
            })
            console.log(`[Kitchen Work Order] Updated catering order ${orderNumber} to "ready" status`)
          }
        }
      } catch (syncError) {
        console.error('[Kitchen Work Order] Error syncing catering order status:', syncError)
        // Don't fail the work order completion if sync fails
      }
    }

    // Notify household
    await prisma.notification.create({
      data: {
        userId: ticket.requestedById,
        maintenanceTicketId: ticket.id,
        type: 'MAINTENANCE_TICKET_WORK_COMPLETED',
        title: 'Work Completed',
        message: `Work on ticket ${ticket.ticketNumber} has been completed`
      }
    })

    return NextResponse.json({ ticket: updatedTicket })
  } catch (error: any) {
    console.error('Error completing work:', error)
    return NextResponse.json(
      { error: 'Failed to complete work', details: error.message },
      { status: 500 }
    )
  }
}
