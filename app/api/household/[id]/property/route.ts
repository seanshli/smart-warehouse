import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/household/[id]/property
 * Get household's own mailbox, doorbells, and packages
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
    const householdId = params.id

    // Verify user is a member of this household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: householdId
        }
      },
      include: {
        household: {
          select: {
            id: true,
            buildingId: true
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const buildingId = membership.household.buildingId

    // Get household's mailbox (only if linked to this household)
    const mailbox = await prisma.mailbox.findFirst({
      where: {
        householdId: householdId,
        buildingId: buildingId || undefined
      },
      include: {
        floor: {
          select: {
            id: true,
            floorNumber: true,
            name: true
          }
        }
      }
    })

    // Get household's doorbells (only if linked to this household)
    const doorbells = await prisma.doorBell.findMany({
      where: {
        householdId: householdId,
        buildingId: buildingId || undefined
      },
      orderBy: {
        doorBellNumber: 'asc'
      }
    })

    // Get household's packages (only packages assigned to this household)
    const packages = await prisma.package.findMany({
      where: {
        householdId: householdId,
        status: {
          not: 'picked_up' // Only show pending packages
        }
      },
      include: {
        locker: {
          select: {
            id: true,
            lockerNumber: true,
            location: true
          }
        }
      },
      orderBy: {
        checkedInAt: 'desc'
      }
    })

    return NextResponse.json({
      mailbox: mailbox || null,
      doorbells: doorbells || [],
      packages: packages || []
    })

  } catch (error) {
    console.error('Error fetching household property:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property information' },
      { status: 500 }
    )
  }
}

