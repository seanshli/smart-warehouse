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
    const buildingId = searchParams.get('buildingId') // For building-specific filtering
    const communityId = searchParams.get('communityId') // For community-specific filtering
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const isAdmin = searchParams.get('admin') === 'true'
    const supplierId = searchParams.get('supplierId') // For supplier admin filtering

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    let where: any = {}

    // Check if user is supplier admin
    let isSupplierAdmin = false
    let userSupplierId: string | null = null
    if (supplierId) {
      // Verify user is admin for this supplier
      const supplierMember = await prisma.supplierMember.findUnique({
        where: {
          userId_supplierId: {
            userId,
            supplierId,
          },
        },
        select: {
          role: true,
          supplierId: true,
        },
      })
      if (supplierMember && (supplierMember.role === 'ADMIN' || supplierMember.role === 'MANAGER')) {
        isSupplierAdmin = true
        userSupplierId = supplierId
      }
    }

    // Check if user is community admin
    let isCommunityAdmin = false
    let userCommunityIds: string[] = []
    if (userId) {
      const communityMemberships = await prisma.communityMember.findMany({
        where: {
          userId: userId,
          role: 'ADMIN'
        },
        select: {
          communityId: true
        }
      })
      if (communityMemberships.length > 0) {
        isCommunityAdmin = true
        userCommunityIds = communityMemberships.map(m => m.communityId)
      }
    }

    // Check if user is building admin
    let isBuildingAdmin = false
    let userBuildingIds: string[] = []
    if (userId) {
      const buildingMemberships = await prisma.buildingMember.findMany({
        where: {
          userId: userId,
          role: 'ADMIN'
        },
        select: {
          buildingId: true
        }
      })
      if (buildingMemberships.length > 0) {
        isBuildingAdmin = true
        userBuildingIds = buildingMemberships.map(m => m.buildingId)
      }
    }

    if (isSupplierAdmin && userSupplierId) {
      // Supplier admin can only see tickets assigned to their supplier
      where.assignedSupplierId = userSupplierId
      if (status) where.status = status
      if (category) where.category = category
      if (householdId) {
        where.householdId = householdId
      }
      // Support buildingId and communityId filters for supplier admin
      if (buildingId || communityId) {
        where.household = {}
        if (buildingId) {
          where.household.buildingId = buildingId
        }
        if (communityId) {
          where.household.building = { communityId }
        }
      }
    } else if (isCommunityAdmin && userCommunityIds.length > 0) {
      // Community admin can only see tickets for their communities
      // If communityId is provided, verify it's one of their communities
      if (communityId && !userCommunityIds.includes(communityId)) {
        return NextResponse.json({ error: 'Access denied. You are not an admin for this community.' }, { status: 403 })
      }
      
      // Filter by user's communities
      where.household = {
        building: {
          communityId: { in: userCommunityIds }
        }
      }
      
      // Apply additional filters if provided
      if (status) where.status = status
      if (category) where.category = category
      if (householdId) {
        where.household = {
          ...where.household,
          id: householdId,
          building: {
            communityId: { in: userCommunityIds }
          }
        }
      }
      // If specific communityId is provided, use it (already verified above)
      if (communityId && userCommunityIds.includes(communityId)) {
        where.household = {
          ...where.household,
          building: { communityId }
        }
      }
    } else if (isBuildingAdmin && userBuildingIds.length > 0) {
      // Building admin can only see tickets for their buildings
      // If buildingId is provided, verify it's one of their buildings
      if (buildingId && !userBuildingIds.includes(buildingId)) {
        return NextResponse.json({ error: 'Access denied. You are not an admin for this building.' }, { status: 403 })
      }
      
      // Filter by user's buildings
      where.household = {
        buildingId: { in: userBuildingIds }
      }
      
      // Apply additional filters if provided
      if (status) where.status = status
      if (category) where.category = category
      if (householdId) {
        where.household = {
          ...where.household,
          id: householdId,
          buildingId: { in: userBuildingIds }
        }
      }
      // If specific buildingId is provided, use it (already verified above)
      if (buildingId && userBuildingIds.includes(buildingId)) {
        where.household = {
          ...where.household,
          buildingId: buildingId
        }
      }
    } else if (isAdmin && user?.isAdmin) {
      // Super admin can see all tickets (no filters = all tickets)
      if (status) where.status = status
      if (category) where.category = category
      // Support householdId filter for admin view
      if (householdId) {
        where.householdId = householdId
      }
      // Support supplierId filter for admin view
      if (supplierId) {
        where.assignedSupplierId = supplierId
      }
      // Support buildingId filter for admin view - filter by households in this building
      if (buildingId) {
        where.household = { buildingId }
      }
      // Support communityId filter for admin view - filter by households in buildings of this community
      if (communityId) {
        where.household = {
          ...where.household,
          building: { communityId }
        }
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

    // Use select instead of include to avoid relation errors
    const tickets = await prisma.maintenanceTicket.findMany({
      where,
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        description: true,
        category: true,
        priority: true,
        status: true,
        location: true,
        photos: true,
        routingType: true,
        requestedAt: true,
        updatedAt: true,
        createdAt: true,
        householdId: true,
        requestedById: true,
        evaluatedById: true,
        assignedCrewId: true,
        assignedSupplierId: true,
        assignedWorkerId: true,
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
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    
    // Return empty array instead of error to prevent UI crashes
    // Log the error for debugging but don't break the user experience
    return NextResponse.json({ 
      tickets: [],
      error: 'Failed to fetch tickets',
      details: error.message 
    }, { status: 200 }) // Return 200 with empty array to prevent UI errors
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
    // Auto-routing rules:
    // - Mail/package/doorbell/catering -> building/community (local services)
    // - Supplier services -> specific supplier based on service mapping
    const defaultRoutingConfig: Record<string, string> = {
      BUILDING_MAINTENANCE: 'INTERNAL_BUILDING',
      HOUSE_CLEANING: 'INTERNAL_COMMUNITY',
      FOOD_ORDER: 'INTERNAL_COMMUNITY', // Catering automatically routed to building/community
      MAIL_SERVICE: 'INTERNAL_BUILDING', // Mail automatically routed to building
      PACKAGE_SERVICE: 'INTERNAL_BUILDING', // Package automatically routed to building
      DOORBELL_SERVICE: 'INTERNAL_BUILDING', // Doorbell automatically routed to building
      CAR_SERVICE: 'EXTERNAL_SUPPLIER',
      APPLIANCE_REPAIR: 'EXTERNAL_SUPPLIER',
      WATER_FILTER: 'EXTERNAL_SUPPLIER', // Will be mapped to specific supplier (e.g., Smar Engo)
      SMART_HOME: 'EXTERNAL_SUPPLIER',
      OTHER: 'INTERNAL_COMMUNITY'
    }
    
    // Service-to-supplier mapping (e.g., WATER_FILTER -> Smar Engo)
    const serviceToSupplierMapping: Record<string, string> = {
      WATER_FILTER: 'Smar Engo', // 智管家
      // Add more mappings as needed: SERVICE_TYPE: 'Supplier Name'
    }

    // Get routing type and supplier assignment from database
    let routingType: string | null = defaultRoutingConfig[category] || 'INTERNAL_COMMUNITY'
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
      } else {
        // If no config found, try to auto-assign supplier based on service mapping
        if (routingType === 'EXTERNAL_SUPPLIER' && serviceToSupplierMapping[category]) {
          const supplierName = serviceToSupplierMapping[category]
          const supplier = await prisma.supplier.findFirst({
            where: {
              name: { contains: supplierName, mode: 'insensitive' },
              isActive: true
            },
            select: { id: true }
          })
          if (supplier) {
            assignedSupplierId = supplier.id
            console.log(`Auto-assigned supplier ${supplierName} (${supplier.id}) for category ${category}`)
          }
        }
      }
    } catch (error) {
      // Table may not exist yet, use defaults
      console.log('job_routing_config table not found, using defaults:', error)
      
      // Still try to auto-assign supplier if it's an external supplier category
      if (routingType === 'EXTERNAL_SUPPLIER' && serviceToSupplierMapping[category]) {
        try {
          const supplierName = serviceToSupplierMapping[category]
          const supplier = await prisma.supplier.findFirst({
            where: {
              name: { contains: supplierName, mode: 'insensitive' },
              isActive: true
            },
            select: { id: true }
          })
          if (supplier) {
            assignedSupplierId = supplier.id
            console.log(`Auto-assigned supplier ${supplierName} (${supplier.id}) for category ${category}`)
          }
        } catch (supplierError) {
          console.log('Error auto-assigning supplier:', supplierError)
        }
      }
    }

    // Ensure routing consistency per database constraint:
    // - EXTERNAL_SUPPLIER: must have assigned_supplier_id, must NOT have assigned_crew_id
    // - INTERNAL_BUILDING/INTERNAL_COMMUNITY: must have assigned_crew_id, must NOT have assigned_supplier_id
    // - NULL routing_type: allowed (no constraints)
    
    let assignedCrewId: string | null = null
    
    if (routingType === 'EXTERNAL_SUPPLIER') {
      if (!assignedSupplierId) {
        // If routing is EXTERNAL_SUPPLIER but no supplier is assigned, set routing to NULL
        console.warn(`Category ${category} configured for EXTERNAL_SUPPLIER but no supplier assigned, setting routing_type to NULL`)
        routingType = null
        assignedSupplierId = null
      } else {
        // Ensure crew is null for external supplier
        assignedCrewId = null
      }
    } else if (routingType === 'INTERNAL_BUILDING' || routingType === 'INTERNAL_COMMUNITY') {
      // For internal routing, we MUST assign a crew per constraint
      // Clear supplier assignment
      assignedSupplierId = null
      
      // Try to find an appropriate crew based on building/community and category
      try {
        const crewType = category === 'BUILDING_MAINTENANCE' ? 'BUILDING_MAINTENANCE' : 
                        category === 'HOUSE_CLEANING' ? 'HOUSE_CLEANING' :
                        category === 'FOOD_ORDER' ? 'FOOD_ORDER' : 'BUILDING_MAINTENANCE'
        
        if (routingType === 'INTERNAL_BUILDING' && household?.buildingId) {
          // Find building crew
          const buildingCrew = await prisma.workingCrew.findFirst({
            where: {
              buildingId: household.buildingId,
              crewType: crewType,
              isActive: true
            },
            select: { id: true }
          })
          
          if (buildingCrew) {
            assignedCrewId = buildingCrew.id
          } else {
            // No crew found, set routing to NULL to satisfy constraint
            console.warn(`No ${crewType} crew found for building ${household.buildingId}, setting routing_type to NULL`)
            routingType = null
          }
        } else if (routingType === 'INTERNAL_COMMUNITY' && household?.building?.communityId) {
          // Find community crew
          const communityCrew = await prisma.workingCrew.findFirst({
            where: {
              communityId: household.building.communityId,
              crewType: crewType,
              isActive: true
            },
            select: { id: true }
          })
          
          if (communityCrew) {
            assignedCrewId = communityCrew.id
          } else {
            // No crew found, set routing to NULL to satisfy constraint
            console.warn(`No ${crewType} crew found for community ${household.building.communityId}, setting routing_type to NULL`)
            routingType = null
          }
        } else {
          // No building/community info, set routing to NULL
          console.warn(`No building/community info for ${routingType} routing, setting routing_type to NULL`)
          routingType = null
        }
      } catch (error) {
        console.error('Error finding crew for internal routing:', error)
        // On error, set routing to NULL to satisfy constraint
        routingType = null
      }
    }

    // Generate ticket number
    // Try format MT-YYYYMMDD-XXXX (matches database trigger format) or RX-YYYY-NNNNNN
    let ticketNumber = ''
    let retries = 0
    const maxRetries = 5
    
    while (retries < maxRetries) {
      try {
        const latestTicket = await prisma.maintenanceTicket.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { ticketNumber: true },
        })
        
        if (latestTicket?.ticketNumber) {
          // Try MT-YYYYMMDD-XXXX format first (from database trigger)
          const mtMatch = latestTicket.ticketNumber.match(/MT-(\d{8})-(\d+)/)
          if (mtMatch) {
            const datePart = mtMatch[1]
            const num = parseInt(mtMatch[2], 10)
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
            
            if (datePart === today) {
              // Same day, increment
              ticketNumber = `MT-${today}-${String(num + 1).padStart(4, '0')}`
            } else {
              // New day, start from 1
              ticketNumber = `MT-${today}-0001`
            }
          } else {
            // Try RX-YYYY-NNNNNN format
            const rxMatch = latestTicket.ticketNumber.match(/RX-(\d{4})-(\d+)/)
            if (rxMatch) {
              const year = rxMatch[1]
              const num = parseInt(rxMatch[2], 10)
              const currentYear = new Date().getFullYear().toString()
              
              if (year === currentYear) {
                // Same year, increment
                ticketNumber = `RX-${currentYear}-${String(num + 1).padStart(6, '0')}`
              } else {
                // New year, start from 1
                ticketNumber = `RX-${currentYear}-000001`
              }
            } else {
              // Unknown format, use MT format (matches database trigger)
              const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
              ticketNumber = `MT-${today}-0001`
            }
          }
        } else {
          // No tickets yet, use MT format (matches database trigger)
          const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
          ticketNumber = `MT-${today}-0001`
        }

        // Check if ticket number already exists (race condition protection)
        const existingTicket = await prisma.maintenanceTicket.findUnique({
          where: { ticketNumber },
          select: { id: true },
        })

        if (existingTicket) {
          // Ticket number collision, retry with incremented number
          retries++
          const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
          const timestamp = Date.now().toString().slice(-6)
          ticketNumber = `MT-${today}-${timestamp}`
          continue
        }

        // Ticket number is unique, break out of loop
        break
      } catch (error) {
        // If query fails, generate a simple ticket number
        console.warn('Failed to get latest ticket number, using simple format:', error)
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const timestamp = Date.now().toString().slice(-6)
        ticketNumber = `MT-${today}-${timestamp}`
        retries++
        if (retries >= maxRetries) {
          // Last resort: use timestamp-based number
          ticketNumber = `MT-${today}-${Date.now().toString().slice(-4)}`
          break
        }
      }
    }

    if (!ticketNumber) {
      // Fallback if all retries failed
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      ticketNumber = `MT-${today}-${Date.now().toString().slice(-4)}`
    }

    // Create ticket with generated ticketNumber
    let ticket
    try {
      ticket = await prisma.maintenanceTicket.create({
        data: {
          ticketNumber, // Generated ticket number
          householdId,
          requestedById: userId,
          title,
          description,
          category,
          priority: priority || 'NORMAL',
          location: resolvedLocation,
          photos: photosArray,
          routingType, // Set routing type based on category (may be null if no crew/supplier found)
          assignedSupplierId, // Auto-assign supplier if configured (must be null for internal routing)
          assignedCrewId, // Auto-assign crew for internal routing (must be null for external routing)
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
    } catch (createError: any) {
      console.error('Error creating ticket:', createError)
      console.error('Create error details:', {
        code: createError.code,
        message: createError.message,
        meta: createError.meta,
        cause: createError.cause,
        stack: createError.stack
      })
      
      // Handle unique constraint violation (ticketNumber collision)
      if (createError.code === 'P2002' && createError.meta?.target?.includes('ticketNumber')) {
        console.error('Ticket number collision detected, retrying with new number:', ticketNumber)
        // Generate a new unique ticket number using timestamp
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const uniqueSuffix = Date.now().toString().slice(-8) // Use more digits for uniqueness
        ticketNumber = `MT-${today}-${uniqueSuffix}`
        
        try {
          // Retry once with new ticket number
          ticket = await prisma.maintenanceTicket.create({
            data: {
              ticketNumber,
              householdId,
              requestedById: userId,
              title,
              description,
              category,
              priority: priority || 'NORMAL',
              location: resolvedLocation,
              photos: photosArray,
            routingType,
            assignedSupplierId,
            assignedCrewId,
            status: assignedSupplierId ? 'EVALUATED' : 'PENDING_EVALUATION'
            },
            select: {
              id: true,
              ticketNumber: true,
              title: true,
              description: true,
              category: true,
              priority: true,
              status: true,
              location: true,
              photos: true,
              requestedAt: true,
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
        } catch (retryError: any) {
          console.error('Retry also failed:', retryError)
          throw retryError
        }
      } else {
        // Re-throw other errors with more context
        throw createError
      }
    }

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
    console.error('Full error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      cause: error.cause,
      stack: error.stack,
      name: error.name
    })
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to create ticket'
    let statusCode = 500
    
    if (error.code === 'P2002') {
      errorMessage = 'Ticket number already exists. Please try again.'
      statusCode = 409
    } else if (error.code === 'P2003') {
      errorMessage = 'Invalid reference. Please check household, user, or other references.'
      statusCode = 400
    } else if (error.message?.includes('constraint')) {
      errorMessage = `Database constraint violation: ${error.message}`
      statusCode = 400
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.message,
        code: error.code,
        meta: error.meta
      },
      { status: statusCode }
    )
  }
}
