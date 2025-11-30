import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/door-bell/ring/public
 * Ring a door bell (public, no auth required for guests)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const buildingId = params.id
    const { doorBellId, doorBellNumber } = await request.json()

    if (!doorBellId && !doorBellNumber) {
      return NextResponse.json(
        { error: 'doorBellId or doorBellNumber is required' },
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

    if (doorBell.buildingId !== buildingId) {
      return NextResponse.json({ error: 'Door bell does not belong to this building' }, { status: 400 })
    }

    if (!doorBell.isEnabled) {
      return NextResponse.json({ error: 'Door bell is disabled' }, { status: 400 })
    }

    if (!doorBell.household) {
      return NextResponse.json({ error: 'Door bell not linked to a household' }, { status: 400 })
    }

    // Update last rung time and create call session
    const callSession = await prisma.doorBellCallSession.create({
      data: {
        doorBellId: doorBell.id,
        status: 'ringing',
        startedAt: new Date(),
      },
    })

    await prisma.doorBell.update({
      where: { id: doorBell.id },
      data: {
        lastRungAt: new Date(),
      },
    })

    // Create notifications for all household members
    const notifications = []
    for (const member of doorBell.household.members) {
      try {
        const notification = await createNotification({
          userId: member.user.id,
          householdId: doorBell.household.id,
          type: 'DOOR_BELL_RUNG',
          title: 'Door Bell',
          message: `Someone is at the door (${doorBell.doorBellNumber})`,
          metadata: {
            doorBellId: doorBell.id,
          },
        })
        notifications.push(notification)
      } catch (error) {
        console.error('Error creating notification:', error)
        // Create notification directly if createNotification fails
        try {
          const notification = await prisma.notification.create({
            data: {
              userId: member.user.id,
              householdId: doorBell.household.id,
              doorBellId: doorBell.id,
              type: 'DOOR_BELL_RUNG',
              title: 'Door Bell',
              message: `Someone is at the door (${doorBell.doorBellNumber})`,
            },
          })
          notifications.push(notification)
        } catch (prismaError) {
          console.error('Error creating notification via Prisma:', prismaError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Door bell rung successfully',
      data: {
        callSessionId: callSession?.id || null,
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

