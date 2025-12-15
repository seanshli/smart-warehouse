import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/maintenance/tickets/[id]/evaluate - Evaluate and route ticket
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

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { routingType, assignedCrewId, assignedSupplierId, notes } = body

    if (!routingType) {
      return NextResponse.json({ error: 'routingType is required' }, { status: 400 })
    }

    if (routingType === 'INTERNAL_BUILDING' || routingType === 'INTERNAL_COMMUNITY') {
      if (!assignedCrewId) {
        return NextResponse.json({ error: 'assignedCrewId required for internal routing' }, { status: 400 })
      }
    } else if (routingType === 'EXTERNAL_SUPPLIER') {
      if (!assignedSupplierId) {
        return NextResponse.json({ error: 'assignedSupplierId required for external routing' }, { status: 400 })
      }
    }

    const ticket = await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        status: 'EVALUATED',
        routingType,
        assignedCrewId: routingType.startsWith('INTERNAL') ? assignedCrewId : null,
        assignedSupplierId: routingType === 'EXTERNAL_SUPPLIER' ? assignedSupplierId : null,
        evaluatedAt: new Date(),
        evaluatedById: userId
      },
      include: {
        household: {
          select: {
            id: true,
            name: true
          }
        },
        assignedCrew: {
          select: {
            id: true,
            name: true
          }
        },
        assignedSupplier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Create notification for household
    await prisma.notification.create({
      data: {
        userId: ticket.requestedById,
        maintenanceTicketId: ticket.id,
        type: 'MAINTENANCE_TICKET_EVALUATED',
        title: 'Ticket Evaluated',
        message: `Ticket ${ticket.ticketNumber} has been evaluated and routed`
      }
    })

    return NextResponse.json({ ticket })
  } catch (error: any) {
    console.error('Error evaluating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate ticket', details: error.message },
      { status: 500 }
    )
  }
}
