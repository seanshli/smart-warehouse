import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/maintenance/tickets/[id] - Get ticket details
export async function GET(
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

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: ticketId },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true,
            buildingId: true,
            building: {
              select: {
                id: true,
                name: true,
                communityId: true,
                community: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        evaluatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedCrew: {
          include: {
            crewLead: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        assignedSupplier: {
          select: {
            id: true,
            name: true,
            contactName: true,
            contactPhone: true,
            contactEmail: true,
            serviceTypes: true
          }
        },
        assignedWorker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        crewSignoffBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        supplierSignoffBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        householdSignoffBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        workLogs: {
          include: {
            loggedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            workDate: 'desc'
          }
        },
        signoffs: {
          include: {
            signedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            signedAt: 'desc'
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

    // Allow access if: household member, assigned worker, crew member, or admin
    const isAssignedWorker = ticket.assignedWorkerId === userId
    const isCrewMember = ticket.assignedCrew?.members.some(m => m.userId === userId)
    const hasAccess = membership || isAssignedWorker || isCrewMember || user?.isAdmin

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ ticket })
  } catch (error: any) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket', details: error.message },
      { status: 500 }
    )
  }
}
