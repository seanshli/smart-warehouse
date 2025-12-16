import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/hardware-suppliers
 * Get hardware-to-supplier mappings (super admin only)
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

    // Get all suppliers
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        serviceTypes: true,
        contactName: true,
        contactPhone: true,
        contactEmail: true,
      },
      orderBy: { name: 'asc' }
    })

    // Define hardware/service types that can be mapped to suppliers
    const hardwareTypes = [
      'APPLIANCE_REPAIR',
      'WATER_FILTER',
      'SMART_HOME',
      'CAR_SERVICE',
      'AIR_CONDITIONING',
      'ELEVATOR',
      'PLUMBING',
      'ELECTRICAL',
      'HVAC',
      'SECURITY_SYSTEM',
      'NETWORK_INFRASTRUCTURE'
    ]

    // Get mappings (in production, store in database)
    // For now, return suppliers with their service types
    const mappings = suppliers.map(supplier => ({
      supplierId: supplier.id,
      supplierName: supplier.name,
      hardwareTypes: supplier.serviceTypes || []
    }))

    return NextResponse.json({
      success: true,
      hardwareTypes,
      suppliers,
      mappings
    })
  } catch (error) {
    console.error('Error fetching hardware-supplier mappings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hardware-supplier mappings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/hardware-suppliers
 * Update hardware-to-supplier mappings (super admin only)
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

    const { supplierId, hardwareTypes } = await request.json()

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    if (!Array.isArray(hardwareTypes)) {
      return NextResponse.json({ error: 'Hardware types must be an array' }, { status: 400 })
    }

    // Update supplier's service types
    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        serviceTypes: hardwareTypes
      },
      select: {
        id: true,
        name: true,
        serviceTypes: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Hardware-supplier mapping updated',
      supplier
    })
  } catch (error) {
    console.error('Error updating hardware-supplier mapping:', error)
    return NextResponse.json(
      { error: 'Failed to update hardware-supplier mapping' },
      { status: 500 }
    )
  }
}
