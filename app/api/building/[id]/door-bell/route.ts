import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingManagement } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/door-bell
 * List all door bells for a building
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

    // Check if user has access to this building
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        members: {
          where: { userId },
        },
        community: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    // Check access (building member or community member)
    const hasAccess = building.members.length > 0 || 
                     building.community.members.length > 0 ||
                     (session.user as any).isAdmin

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const doorBells = await prisma.doorBell.findMany({
      where: { buildingId },
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

