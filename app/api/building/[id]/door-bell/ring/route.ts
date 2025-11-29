import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/door-bell/ring
 * Ring a door bell (triggers notification to household)
 * Body: { doorBellNumber: string } or { doorBellId: string }
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

    const buildingId = params.id
    const { doorBellNumber, doorBellId } = await request.json()

    if (!doorBellNumber && !doorBellId) {
      return NextResponse.json(
        { error: 'doorBellNumber or doorBellId is required' },
        { status: 400 }
      )
    }

    // Find door bell
    const doorBell = doorBellId
      ? await prisma.doorBell.findUnique({
          where: { id: doorBellId },
          include: {
            household: {
              include: {
                members: {
                  include: {
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
        })
      : await prisma.doorBell.findUnique({
          where: {
            buildingId_doorBellNumber: {
              buildingId,
              doorBellNumber: doorBellNumber!,
            },
          },
          include: {
            household: {
              include: {
                members: {
                  include: {
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
        })

    if (!doorBell) {
      return NextResponse.json({ error: 'Door bell not found' }, { status: 404 })
    }

    // Verify building matches if found by ID
    if (doorBell.buildingId !== buildingId) {
      return NextResponse.json({ error: 'Door bell does not belong to this building' }, { status: 400 })
    }

    if (!doorBell.isEnabled) {
      return NextResponse.json({ error: 'Door bell is disabled' }, { status: 400 })
    }

    if (!doorBell.household) {
      return NextResponse.json({ error: 'Door bell not linked to a household' }, { status: 400 })
    }

    // Update last rung time
    await prisma.doorBell.update({
      where: { id: doorBell.id },
      data: {
        lastRungAt: new Date(),
      },
    })

    // Create notifications for all household members
    const notifications = []
    for (const member of doorBell.household.members) {
      const notification = await prisma.notification.create({
        data: {
          type: 'DOOR_BELL_RUNG',
          title: 'Door Bell',
          message: `Someone is at the door (${doorBell.doorBellNumber})`,
          userId: member.user.id,
          doorBellId: doorBell.id,
        },
      })
      notifications.push(notification)
    }

    return NextResponse.json({
      success: true,
      message: 'Door bell rung successfully',
      data: {
        doorBell: {
          id: doorBell.id,
          doorBellNumber: doorBell.doorBellNumber,
          lastRungAt: new Date(),
        },
        notificationsSent: notifications.length,
      },
    })
  } catch (error) {
    console.error('Error ringing door bell:', error)
    return NextResponse.json(
      { error: 'Failed to ring door bell' },
      { status: 500 }
    )
  }
}


