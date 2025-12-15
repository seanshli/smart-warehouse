import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/maintenance/tickets/[id]/signoff - Sign off on ticket
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
    const { signoffType, comments, rating, attachments } = body

    if (!signoffType) {
      return NextResponse.json({ error: 'signoffType is required' }, { status: 400 })
    }

    // Get ticket
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: ticketId },
      include: {
        assignedCrew: {
          include: {
            crewLead: {
              select: { id: true }
            },
            members: {
              select: { userId: true, role: true }
            }
          }
        },
        household: {
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

    // Verify signoff permissions
    let hasPermission = false
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    if (signoffType === 'CREW_LEAD') {
      // Crew lead can sign off
      hasPermission = ticket.assignedCrew?.crewLeadId === userId || 
                     ticket.assignedCrew?.members.some(m => m.userId === userId && m.role === 'LEAD') ||
                     user?.isAdmin || false
    } else if (signoffType === 'SUPPLIER_LEAD') {
      // Supplier lead (admin can sign off on behalf)
      hasPermission = user?.isAdmin || false
    } else if (signoffType === 'HOUSEHOLD') {
      // Household member can sign off
      hasPermission = ticket.household.members.some(m => m.userId === userId) || false
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied for this signoff type' }, { status: 403 })
    }

    // Create signoff record
    const signoff = await prisma.maintenanceTicketSignoff.create({
      data: {
        ticketId,
        signoffType,
        signedById: userId,
        comments,
        rating: rating ? parseInt(rating) : null,
        attachments: attachments || []
      },
      include: {
        signedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Update ticket based on signoff type
    let newStatus = ticket.status
    let updateData: any = {}

    if (signoffType === 'CREW_LEAD') {
      updateData.crewSignoffAt = new Date()
      updateData.crewSignoffById = userId
      newStatus = 'SIGNED_OFF_BY_CREW'
    } else if (signoffType === 'SUPPLIER_LEAD') {
      updateData.supplierSignoffAt = new Date()
      updateData.supplierSignoffById = userId
      newStatus = 'SIGNED_OFF_BY_SUPPLIER'
    } else if (signoffType === 'HOUSEHOLD') {
      updateData.householdSignoffAt = new Date()
      updateData.householdSignoffById = userId
      newStatus = 'SIGNED_OFF_BY_HOUSEHOLD'
      
      // If household signs off, close the ticket
      updateData.closedAt = new Date()
      newStatus = 'CLOSED'
    }

    const updatedTicket = await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
        ...updateData
      }
    })

    // Create notifications
    if (signoffType === 'CREW_LEAD' || signoffType === 'SUPPLIER_LEAD') {
      // Notify household that crew/supplier signed off
      await prisma.notification.create({
        data: {
          userId: ticket.requestedById,
          maintenanceTicketId: ticket.id,
          type: 'MAINTENANCE_TICKET_SIGNED_OFF',
          title: 'Ticket Signed Off',
          message: `Ticket ${ticket.ticketNumber} has been signed off by ${signoffType === 'CREW_LEAD' ? 'crew lead' : 'supplier'}. Please review and sign off.`
        }
      })
    } else if (signoffType === 'HOUSEHOLD') {
      // Notify assigned crew/supplier that household signed off
      if (ticket.assignedCrewId) {
        const crew = await prisma.workingCrew.findUnique({
          where: { id: ticket.assignedCrewId },
          include: {
            members: {
              select: { userId: true }
            }
          }
        })
        if (crew) {
          for (const member of crew.members) {
            await prisma.notification.create({
              data: {
                userId: member.userId,
                maintenanceTicketId: ticket.id,
                type: 'MAINTENANCE_TICKET_CLOSED',
                title: 'Ticket Closed',
                message: `Ticket ${ticket.ticketNumber} has been closed by household`
              }
            })
          }
        }
      }
    }

    return NextResponse.json({ signoff, ticket: updatedTicket })
  } catch (error: any) {
    console.error('Error creating signoff:', error)
    return NextResponse.json(
      { error: 'Failed to create signoff', details: error.message },
      { status: 500 }
    )
  }
}
