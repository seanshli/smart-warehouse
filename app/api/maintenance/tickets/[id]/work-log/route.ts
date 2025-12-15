import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/maintenance/tickets/[id]/work-log - Add work log
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

    const body = await request.json()
    const { workDescription, hoursWorked, materialsUsed, notes, attachments } = body

    if (!workDescription) {
      return NextResponse.json({ error: 'workDescription is required' }, { status: 400 })
    }

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

    // Create work log
    const workLog = await prisma.maintenanceTicketWorkLog.create({
      data: {
        ticketId,
        loggedById: userId,
        workDescription,
        hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
        materialsUsed,
        notes,
        attachments: attachments || []
      },
      include: {
        loggedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Update ticket status if not already in progress
    if (ticket.status === 'ASSIGNED' || ticket.status === 'EVALUATED') {
      await prisma.maintenanceTicket.update({
        where: { id: ticketId },
        data: {
          status: 'IN_PROGRESS',
          workStartedAt: ticket.workStartedAt || new Date()
        }
      })
    }

    return NextResponse.json({ workLog }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating work log:', error)
    return NextResponse.json(
      { error: 'Failed to create work log', details: error.message },
      { status: 500 }
    )
  }
}
