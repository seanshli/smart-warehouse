import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingAccess } from '@/lib/middleware/community-permissions'

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

