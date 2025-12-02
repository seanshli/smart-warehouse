import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { broadcastDoorBellEvent } from '@/lib/realtime'

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
    const body = await request.json().catch(() => ({}))
    const { doorBellId, doorBellNumber } = body

    console.log('Doorbell ring request:', { buildingId, doorBellId, doorBellNumber })

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
      console.error(`Doorbell not found: buildingId=${buildingId}, doorBellId=${doorBellId}, doorBellNumber=${doorBellNumber}`)
      return NextResponse.json({ 
        error: 'Door bell not found',
        details: doorBellId ? `No doorbell found with ID: ${doorBellId}` : `No doorbell found with number: ${doorBellNumber}`
      }, { status: 404 })
    }

    console.log(`Found doorbell: ${doorBell.id} (${doorBell.doorBellNumber}), enabled: ${doorBell.isEnabled}, household: ${doorBell.household?.id || 'none'}`)

    if (doorBell.buildingId !== buildingId) {
      console.error(`Doorbell ${doorBell.id} belongs to building ${doorBell.buildingId}, but request was for ${buildingId}`)
      return NextResponse.json({ 
        error: 'Door bell does not belong to this building',
        details: `Doorbell ${doorBell.doorBellNumber} belongs to a different building`
      }, { status: 400 })
    }

    if (!doorBell.isEnabled) {
      console.error(`Doorbell ${doorBell.id} (${doorBell.doorBellNumber}) is disabled`)
      return NextResponse.json({ 
        error: 'Door bell is disabled',
        details: `Doorbell ${doorBell.doorBellNumber} is currently disabled`
      }, { status: 400 })
    }

    if (!doorBell.household) {
      console.error(`Doorbell ${doorBell.id} (${doorBell.doorBellNumber}) is not linked to a household`)
      return NextResponse.json({ 
        error: 'Door bell not linked to a household',
        details: `Doorbell ${doorBell.doorBellNumber} needs to be linked to a household before it can be rung`
      }, { status: 400 })
    }

    if (!doorBell.household.members || doorBell.household.members.length === 0) {
      console.error(`Doorbell ${doorBell.id} (${doorBell.doorBellNumber}) household has no members`)
      return NextResponse.json({ 
        error: 'Household has no members',
        details: `The household linked to doorbell ${doorBell.doorBellNumber} has no members. Please add members to the household first.`
      }, { status: 400 })
    }

    // End any existing active sessions for this doorbell first
    try {
      await prisma.doorBellCallSession.updateMany({
        where: {
          doorBellId: doorBell.id,
          status: {
            in: ['ringing', 'connected'],
          },
        },
        data: {
          status: 'ended',
          endedAt: new Date(),
        },
      })
    } catch (updateError) {
      console.error('Error ending existing sessions:', updateError)
      // Continue even if this fails
    }

    // Create new call session
    let callSession
    try {
      callSession = await prisma.doorBellCallSession.create({
        data: {
          doorBellId: doorBell.id,
          status: 'ringing',
          startedAt: new Date(),
        },
      })
    } catch (sessionError: any) {
      console.error('Error creating call session:', sessionError)
      // If it's a unique constraint or foreign key error, provide more details
      if (sessionError.code === 'P2002') {
        return NextResponse.json(
          { error: 'A call session already exists for this doorbell' },
          { status: 409 }
        )
      }
      if (sessionError.code === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid doorbell reference' },
          { status: 400 }
        )
      }
      throw sessionError
    }

    await prisma.doorBell.update({
      where: { id: doorBell.id },
      data: {
        lastRungAt: new Date(),
      },
    })

    // Get building info for announcement
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        community: {
          select: {
            id: true,
          },
        },
      },
    })

    // Create announcement for the household about visitor arrival
    let announcement = null
    try {
      const firstMember = doorBell.household.members[0]
      if (firstMember) {
        announcement = await prisma.announcement.create({
          data: {
            source: 'BUILDING',
            sourceId: buildingId,
            title: 'Visitor Arrived',
            message: `A visitor has arrived at doorbell ${doorBell.doorBellNumber}`,
            targetType: 'SPECIFIC_HOUSEHOLD',
            targetId: doorBell.household.id,
            createdBy: firstMember.user.id,
            isActive: true,
          },
        })
      }
    } catch (announcementError) {
      console.error('Error creating announcement:', announcementError)
      // Continue even if announcement creation fails
    }

    // Log activity for each household member
    const activities = []
    for (const member of doorBell.household.members) {
      try {
        const activity = await prisma.userActivity.create({
          data: {
            userId: member.user.id,
            householdId: doorBell.household.id,
            activityType: 'navigate',
            action: 'doorbell_ring',
            description: `Visitor arrived at doorbell ${doorBell.doorBellNumber}`,
            metadata: {
              doorBellId: doorBell.id,
              doorBellNumber: doorBell.doorBellNumber,
              callSessionId: callSession.id,
              timestamp: new Date().toISOString(),
            },
          },
        })
        activities.push(activity)
      } catch (activityError: any) {
        console.error('Error logging activity:', activityError)
        // Continue even if activity logging fails - don't block doorbell ringing
      }
    }

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

    // Broadcast doorbell event in real-time to household and front desk
    try {
      broadcastDoorBellEvent(
        doorBell.id,
        doorBell.household?.id || null,
        buildingId,
        {
          event: 'ring',
          callSessionId: callSession?.id,
          doorBellNumber: doorBell.doorBellNumber,
          household: doorBell.household ? {
            id: doorBell.household.id,
            name: doorBell.household.name,
            apartmentNo: doorBell.household.apartmentNo,
          } : null,
        }
      )
    } catch (broadcastError) {
      console.error('Error broadcasting doorbell event:', broadcastError)
      // Don't fail the request if broadcast fails
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
        announcementCreated: !!announcement,
        activitiesLogged: activities.length,
      },
    })
  } catch (error: any) {
    console.error('Error ringing door bell:', error)
    console.error('Error details:', {
      code: error?.code,
      meta: error?.meta,
      message: error?.message,
    })
    
    // Provide more specific error messages
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Database constraint violation - duplicate entry' },
        { status: 409 }
      )
    }
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid reference - doorbell or related record not found' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to ring door bell',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

