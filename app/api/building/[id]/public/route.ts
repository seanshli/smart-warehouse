import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/public
 * Get public building information (no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const buildingId = params.id

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: building })
  } catch (error) {
    console.error('Error fetching building:', error)
    return NextResponse.json(
      { error: 'Failed to fetch building' },
      { status: 500 }
    )
  }
}

