import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateConversation } from '@/lib/messaging/permissions'

// POST /api/maintenance/tickets/[id]/conversation - Create/get conversation for ticket
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

    // Get ticket
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: ticketId },
      include: {
        household: {
          select: {
            id: true,
            buildingId: true
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check access
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId: ticket.householdId
        }
      }
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    const isAssignedWorker = ticket.assignedWorkerId === userId
    const isCrewMember = ticket.assignedCrewId ? await prisma.crewMember.findUnique({
      where: {
        crewId_userId: {
          crewId: ticket.assignedCrewId,
          userId
        }
      }
    }) : null

    const hasAccess = membership || isAssignedWorker || isCrewMember || user?.isAdmin

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create or get conversation for this ticket
    const conversationId = await getOrCreateConversation(
      userId,
      ticket.householdId,
      ticket.household.buildingId || null,
      'maintenance_ticket',
      ticketId
    )

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true
          }
        },
        building: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    return NextResponse.json({ conversation })
  } catch (error: any) {
    console.error('Error creating ticket conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error.message },
      { status: 500 }
    )
  }
}
