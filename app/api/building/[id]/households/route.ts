import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingAccess, checkBuildingManagement } from '@/lib/middleware/community-permissions'
import { syncFrontDoorFeatures } from '@/lib/building/front-door'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/households
 * Get all households in a building
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

    const households = await prisma.household.findMany({
      where: { buildingId },
      include: {
        floor: {
          select: {
            id: true,
            floorNumber: true,
            name: true,
            isResidential: true,
          },
        },
        _count: {
          select: {
            members: true,
            items: true,
            rooms: true,
          },
        },
      },
      orderBy: [
        { floorNumber: 'asc' },
        { unit: 'asc' },
        { name: 'asc' },
      ],
    })

    // Group households by floor
    const floorsMap = new Map<number, any[]>()
    households.forEach(h => {
      const floorNum = h.floorNumber || 0
      if (!floorsMap.has(floorNum)) {
        floorsMap.set(floorNum, [])
      }
      floorsMap.get(floorNum)!.push({
        id: h.id,
        name: h.name,
        description: h.description,
        apartmentNo: h.apartmentNo,
        unit: h.unit,
        address: h.address,
        floorNumber: h.floorNumber,
        floor: h.floor,
        stats: {
          members: h._count.members,
          items: h._count.items,
          rooms: h._count.rooms,
        },
        createdAt: h.createdAt,
      })
    })

    // Convert to array and sort by floor number
    const floors = Array.from(floorsMap.entries())
      .map(([floorNumber, households]) => ({
        floorNumber,
        households,
        floor: households[0]?.floor,
      }))
      .sort((a, b) => b.floorNumber - a.floorNumber) // Descending order (top floor first)

    return NextResponse.json({
      households: households.map(h => ({
        id: h.id,
        name: h.name,
        description: h.description,
        apartmentNo: h.apartmentNo,
        unit: h.unit,
        address: h.address,
        floorNumber: h.floorNumber,
        floor: h.floor,
        stats: {
          members: h._count.members,
          items: h._count.items,
          rooms: h._count.rooms,
        },
        createdAt: h.createdAt,
      })),
      floors,
    })
  } catch (error) {
    console.error('Error fetching building households:', error)
    return NextResponse.json(
      { error: 'Failed to fetch building households' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/building/[id]/households
 * Create households on a specific floor
 */
export async function POST(
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
    const floorNumber = Number(body.floorNumber)
    const unitsInput: string[] | null = Array.isArray(body.units) ? body.units : null
    const count = typeof body.count === 'number' ? body.count : null

    if (!floorNumber || Number.isNaN(floorNumber) || floorNumber < 1) {
      return NextResponse.json({ error: 'floorNumber must be a positive number' }, { status: 400 })
    }

    if (!unitsInput && (!count || count < 1)) {
      return NextResponse.json({ error: 'Provide units array or count > 0' }, { status: 400 })
    }

    const units =
      unitsInput?.map((unit: string) => unit.trim().toUpperCase()).filter(Boolean) ||
      Array.from({ length: Math.min(count ?? 0, 12) }, (_, idx) => String.fromCharCode(65 + idx))

    if (units.length === 0) {
      return NextResponse.json({ error: 'No units provided' }, { status: 400 })
    }

    const hasAccess = await checkBuildingManagement(userId, buildingId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const existingHouseholds = await prisma.household.findMany({
      where: {
        buildingId,
        floorNumber,
        unit: {
          in: units,
        },
      },
      select: { unit: true },
    })

    if (existingHouseholds.length > 0) {
      const conflicts = existingHouseholds.map((h) => h.unit).join(', ')
      return NextResponse.json(
        { error: `Households already exist for units: ${conflicts}` },
        { status: 400 }
      )
    }

    const floor = await prisma.floor.upsert({
      where: {
        buildingId_floorNumber: {
          buildingId,
          floorNumber,
        },
      },
      update: {
        name: `Floor ${floorNumber}`,
        isResidential: true,
      },
      create: {
        buildingId,
        floorNumber,
        name: `Floor ${floorNumber}`,
        description: 'Residential floor',
        isResidential: true,
      },
    })

    const createdHouseholds = await prisma.$transaction(
      units.map((unit) => {
        const apartmentNo = `${floorNumber}${unit}`
        return prisma.household.create({
          data: {
            buildingId,
            floorId: floor.id,
            floorNumber,
            unit,
            name: `Unit ${apartmentNo}`,
            apartmentNo,
            description: `Residential unit ${apartmentNo}`,
          },
        })
      })
    )

    await syncFrontDoorFeatures(buildingId)

    return NextResponse.json({
      success: true,
      data: createdHouseholds,
    })
  } catch (error) {
    console.error('Error creating building households:', error)
    return NextResponse.json(
      { error: 'Failed to create households' },
      { status: 500 }
    )
  }
}

