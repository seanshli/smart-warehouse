import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/maintenance/tickets - List tickets (household or admin view)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const isAdmin = searchParams.get('admin') === 'true'

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    let where: any = {}

    if (isAdmin && user?.isAdmin) {
      // Admin can see all tickets
      if (status) where.status = status
      if (category) where.category = category
      // Support householdId filter for admin view
      if (householdId) {
        where.householdId = householdId
      }
    } else {
      // Household members can only see their household's tickets
      if (!householdId) {
        return NextResponse.json({ error: 'householdId required' }, { status: 400 })
      }

      // Verify user belongs to this household
      const membership = await prisma.householdMember.findUnique({
        where: {
          userId_householdId: {
            userId,
            householdId
          }
        }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      where.householdId = householdId
      if (status) where.status = status
      if (category) where.category = category
    }

    const tickets = await prisma.maintenanceTicket.findMany({
      where,
      include: {
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true
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
          select: {
            id: true,
            name: true,
            crewType: true
          }
        },
        assignedSupplier: {
          select: {
            id: true,
            name: true,
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
        _count: {
          select: {
            workLogs: true,
            signoffs: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    })

    return NextResponse.json({ tickets })
  } catch (error: any) {
    console.error('Error fetching maintenance tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/maintenance/tickets - Create new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { householdId, title, description, category, priority, location, photos } = body
    // Photos are optional - default to empty array if not provided
    const photosArray = Array.isArray(photos) ? photos : (photos ? [photos] : [])

    if (!householdId || !title || !category) {
      return NextResponse.json(
        { error: 'householdId, title, and category are required' },
        { status: 400 }
      )
    }

    // Verify user belongs to this household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get household's building/community for routing
    // Also resolve location if it's a room ID
    let resolvedLocation = location
    if (location) {
      // Check if location is a room ID (UUID format)
      const roomIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (roomIdPattern.test(location)) {
        const room = await prisma.room.findUnique({
          where: { id: location },
          select: { name: true }
        })
        if (room) {
          resolvedLocation = room.name
        }
      }
    }
    
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: {
        buildingId: true,
        building: {
          select: {
            id: true,
            communityId: true
          }
        }
      }
    })

    // Get routing configuration from job-routing API
    // Default routing configuration (matches job-routing API)
    const defaultRoutingConfig: Record<string, string> = {
      BUILDING_MAINTENANCE: 'INTERNAL_BUILDING',
      HOUSE_CLEANING: 'INTERNAL_COMMUNITY',
      FOOD_ORDER: 'INTERNAL_COMMUNITY',
      CAR_SERVICE: 'EXTERNAL_SUPPLIER',
      APPLIANCE_REPAIR: 'EXTERNAL_SUPPLIER',
      WATER_FILTER: 'EXTERNAL_SUPPLIER',
      SMART_HOME: 'EXTERNAL_SUPPLIER',
      OTHER: 'INTERNAL_COMMUNITY'
    }

    // Get routing type and supplier assignment from database
    let routingType = defaultRoutingConfig[category] || 'INTERNAL_COMMUNITY'
    let assignedSupplierId: string | null = null

    try {
      // Try to get configured routing and supplier from job_routing_config table
      const routingConfig = await prisma.$queryRaw<Array<{
        routing_type: string
        supplier_id: string | null
      }>>`
        SELECT routing_type, supplier_id
        FROM job_routing_config
        WHERE category = ${category}
        LIMIT 1
      `

      if (routingConfig.length > 0) {
        routingType = routingConfig[0].routing_type
        assignedSupplierId = routingConfig[0].supplier_id
      }
    } catch (error) {
      // Table may not exist yet, use defaults
      console.log('job_routing_config table not found, using defaults:', error)
    }

    // Create ticket (ticketNumber will be auto-generated by database trigger)
    const ticket = await prisma.maintenanceTicket.create({
      data: {
        ticketNumber: '', // Empty value, will be auto-generated by database trigger
        householdId,
        requestedById: userId,
        title,
        description,
        category,
        priority: priority || 'NORMAL',
        location: resolvedLocation,
        photos: photosArray,
        routingType, // Set routing type based on category
        assignedSupplierId, // Auto-assign supplier if configured
        status: assignedSupplierId ? 'EVALUATED' : 'PENDING_EVALUATION' // Auto-evaluate if supplier is assigned
      },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create notification for admins
    if (household?.buildingId) {
      // Notify building admins
      const buildingAdmins = await prisma.buildingMember.findMany({
        where: {
          buildingId: household.buildingId,
          role: 'ADMIN',
          memberClass: 'building'
        },
        select: { userId: true }
      })

      for (const admin of buildingAdmins) {
        await prisma.notification.create({
          data: {
            userId: admin.userId,
            maintenanceTicketId: ticket.id,
            type: 'MAINTENANCE_TICKET_CREATED',
            title: 'New Maintenance Ticket',
            message: `New ticket ${ticket.ticketNumber}: ${title}`
          }
        })
      }
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating maintenance ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket', details: error.message },
      { status: 500 }
    )
  }
}
