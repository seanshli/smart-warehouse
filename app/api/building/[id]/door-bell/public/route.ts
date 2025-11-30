import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/door-bell/public
 * List all door bells for a building (public, no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const buildingId = params.id

    const doorBells = await prisma.doorBell.findMany({
      where: { 
        buildingId,
        isEnabled: true,
      },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true,
          },
        },
      },
      orderBy: {
        doorBellNumber: 'asc',
      },
    })

    return NextResponse.json({ success: true, data: doorBells })
  } catch (error) {
    console.error('Error fetching door bells:', error)
    return NextResponse.json(
      { error: 'Failed to fetch door bells' },
      { status: 500 }
    )
  }
}

