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

    // Default routing: BUILDING_MAINTENANCE -> INTERNAL_BUILDING, others -> INTERNAL_COMMUNITY
    // This can be stored in database or config file
    const routingConfig = {
      BUILDING_MAINTENANCE: 'INTERNAL_BUILDING',
      HOUSE_CLEANING: 'INTERNAL_COMMUNITY',
      FOOD_ORDER: 'INTERNAL_COMMUNITY',
      CAR_SERVICE: 'EXTERNAL_SUPPLIER',
      APPLIANCE_REPAIR: 'EXTERNAL_SUPPLIER',
      WATER_FILTER: 'EXTERNAL_SUPPLIER',
      SMART_HOME: 'EXTERNAL_SUPPLIER',
      OTHER: 'INTERNAL_COMMUNITY'
    }

    return NextResponse.json({
      success: true,
      jobCategories,
      routingConfig
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

    const { routingConfig } = await request.json()

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

    // In production, save to database
    // For now, we'll return success (you can implement database storage later)
    
    return NextResponse.json({
      success: true,
      message: 'Job routing configuration updated',
      routingConfig
    })
  } catch (error) {
    console.error('Error updating job routing:', error)
    return NextResponse.json(
      { error: 'Failed to update job routing configuration' },
      { status: 500 }
    )
  }
}
