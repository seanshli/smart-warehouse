import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingAccess } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/mailboxes
 * Get all mailboxes for a building
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

    // Check if user has access to view this building
    const hasAccess = await checkBuildingAccess(userId, buildingId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const mailboxes = await prisma.mailbox.findMany({
      where: { buildingId },
      include: {
        floor: {
          select: {
            id: true,
            floorNumber: true,
            name: true,
          },
        },
        household: {
          select: {
            id: true,
            name: true,
            floorNumber: true,
            unit: true,
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { floor: { floorNumber: 'asc' } },
        { mailboxNumber: 'asc' },
      ],
    })

    return NextResponse.json({ mailboxes })
  } catch (error) {
    console.error('Error fetching mailboxes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mailboxes' },
      { status: 500 }
    )
  }
}

