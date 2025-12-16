import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/job-routing
 * Get job routing configuration (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check if user is super admin
    if (!(await isSuperAdmin(userId))) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    // Get all job routing configurations
    // For now, we'll use a simple approach: store routing rules in a JSON config
    // In production, you might want a dedicated table for this
    
    // Define available job categories
    const jobCategories = [
      'BUILDING_MAINTENANCE',
      'HOUSE_CLEANING',
      'FOOD_ORDER',
      'CAR_SERVICE',
      'APPLIANCE_REPAIR',
      'WATER_FILTER',
      'SMART_HOME',
      'OTHER'
    ]

    // Get routing configuration from database
    let routingConfig: Record<string, string> = {}
    let supplierAssignments: Record<string, string> = {}

    try {
      // Try to get from job_routing_config table
      const storedConfigs = await prisma.$queryRaw<Array<{
        category: string
        routing_type: string
        supplier_id: string | null
      }>>`
        SELECT category, routing_type, supplier_id
        FROM job_routing_config
        ORDER BY category
      `

      // Build routing config and supplier assignments from database
      storedConfigs.forEach(config => {
        routingConfig[config.category] = config.routing_type
        if (config.supplier_id) {
          supplierAssignments[config.category] = config.supplier_id
        }
      })

      // If no configs found, use defaults
      if (storedConfigs.length === 0) {
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
        routingConfig = defaultRoutingConfig
      }
    } catch (error) {
      console.error('Error fetching stored routing config (table may not exist yet):', error)
      // Fall back to defaults if table doesn't exist
      routingConfig = {
        BUILDING_MAINTENANCE: 'INTERNAL_BUILDING',
        HOUSE_CLEANING: 'INTERNAL_COMMUNITY',
        FOOD_ORDER: 'INTERNAL_COMMUNITY',
        CAR_SERVICE: 'EXTERNAL_SUPPLIER',
        APPLIANCE_REPAIR: 'EXTERNAL_SUPPLIER',
        WATER_FILTER: 'EXTERNAL_SUPPLIER',
        SMART_HOME: 'EXTERNAL_SUPPLIER',
        OTHER: 'INTERNAL_COMMUNITY'
      }
    }

    // Get all suppliers for the UI
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        serviceTypes: true,
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      jobCategories,
      routingConfig,
      supplierAssignments,
      suppliers
    })
  } catch (error) {
    console.error('Error fetching job routing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job routing configuration' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/job-routing
 * Update job routing configuration (super admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check if user is super admin
    if (!(await isSuperAdmin(userId))) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const { routingConfig, supplierAssignments } = await request.json()

    if (!routingConfig || typeof routingConfig !== 'object') {
      return NextResponse.json({ error: 'Invalid routing configuration' }, { status: 400 })
    }

    // Validate routing types
    const validRoutingTypes = ['INTERNAL_BUILDING', 'INTERNAL_COMMUNITY', 'EXTERNAL_SUPPLIER']
    for (const [category, routingType] of Object.entries(routingConfig)) {
      if (!validRoutingTypes.includes(routingType as string)) {
        return NextResponse.json(
          { error: `Invalid routing type for ${category}: ${routingType}` },
          { status: 400 }
        )
      }
    }

    // Validate supplier assignments
    if (supplierAssignments && typeof supplierAssignments === 'object') {
      for (const [category, supplierId] of Object.entries(supplierAssignments)) {
        // Only validate if routing type is EXTERNAL_SUPPLIER
        if (routingConfig[category] === 'EXTERNAL_SUPPLIER' && supplierId) {
          // Verify supplier exists
          const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId as string }
          })
          if (!supplier) {
            return NextResponse.json(
              { error: `Invalid supplier ID for ${category}: ${supplierId}` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Store configuration in database
    try {
      // Use upsert to insert or update each category configuration
      for (const [category, routingType] of Object.entries(routingConfig)) {
        const supplierId = supplierAssignments?.[category] || null

        await prisma.$executeRaw`
          INSERT INTO job_routing_config (category, routing_type, supplier_id, created_at, updated_at)
          VALUES (${category}, ${routingType}, ${supplierId}, NOW(), NOW())
          ON CONFLICT (category) 
          DO UPDATE SET 
            routing_type = EXCLUDED.routing_type,
            supplier_id = EXCLUDED.supplier_id,
            updated_at = NOW()
        `
      }

      return NextResponse.json({
        success: true,
        message: 'Job routing configuration updated',
        routingConfig,
        supplierAssignments: supplierAssignments || {}
      })
    } catch (error: any) {
      // If table doesn't exist, return error with instructions
      if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
        console.error('job_routing_config table does not exist. Please run PHASE2_JOB_ROUTING_SQL.sql first.')
        return NextResponse.json({
          error: 'Database table not found. Please run the SQL migration first.',
          details: 'The job_routing_config table needs to be created. See PHASE2_JOB_ROUTING_SQL.sql'
        }, { status: 500 })
      }
      throw error
    }
  } catch (error) {
    console.error('Error updating job routing:', error)
    return NextResponse.json(
      { error: 'Failed to update job routing configuration' },
      { status: 500 }
    )
  }
}
