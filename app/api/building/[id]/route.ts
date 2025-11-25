import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingAccess, checkBuildingManagement } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]
 * Get building details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const buildingId = params.id

    // Check access
    if (!(await checkBuildingAccess(userId, buildingId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        floorCount: true,
        unitCount: true,
        latitude: true,
        longitude: true,
        invitationCode: true,
        createdAt: true,
        updatedAt: true,
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            households: true,
            floors: true,
            mailboxes: true,
          },
        },
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: building.id,
      name: building.name,
      description: building.description,
      address: building.address,
      floorCount: building.floorCount,
      unitCount: building.unitCount,
      latitude: building.latitude,
      longitude: building.longitude,
      invitationCode: building.invitationCode,
      community: building.community,
      householdCount: building._count.households,
      floorCountActual: building._count.floors,
      mailboxCount: building._count.mailboxes,
      createdAt: building.createdAt,
      updatedAt: building.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching building:', error)
    return NextResponse.json(
      { error: 'Failed to fetch building' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/building/[id]
 * Update building
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const buildingId = params.id
    const body = await request.json()

    // Check permission
    if (!(await checkBuildingManagement(userId, buildingId))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, description, address, floorCount, unitCount, latitude, longitude } = body

    const updated = await prisma.building.update({
      where: { id: buildingId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(floorCount !== undefined && { floorCount }),
        ...(unitCount !== undefined && { unitCount }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating building:', error)
    return NextResponse.json(
      { error: 'Failed to update building' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/building/[id]
 * Delete building
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const buildingId = params.id

    // Check permission
    if (!(await checkBuildingManagement(userId, buildingId))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if building has households
    const householdCount = await prisma.household.count({
      where: { buildingId },
    })

    if (householdCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete building with existing households' },
        { status: 400 }
      )
    }

    await prisma.building.delete({
      where: { id: buildingId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting building:', error)
    return NextResponse.json(
      { error: 'Failed to delete building' },
      { status: 500 }
    )
  }
}

