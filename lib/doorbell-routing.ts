import { prisma } from '@/lib/prisma'
import { broadcastDoorBellEvent } from '@/lib/realtime'
import { createNotification } from '@/lib/notifications'

/**
 * Get front desk working group members for a building
 */
export async function getFrontDeskMembers(buildingId: string) {
  try {
    // Get building to find community
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: { 
        id: true,
        communityId: true,
      },
    })

    if (!building) {
      console.error(`Building not found: ${buildingId}`)
      return []
    }

    // Find Front Door Team working group for this building
    const frontDoorGroups = await prisma.workingGroup.findMany({
      where: {
        communityId: building.communityId,
        type: 'FRONT_DOOR_TEAM',
        permissions: {
          some: {
            OR: [
              { scope: 'ALL_BUILDINGS' },
              { 
                scope: 'SPECIFIC_BUILDING',
                scopeId: buildingId,
              },
            ],
          },
        },
      },
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
    })

    // Collect all members from front door groups
    const members: Array<{ id: string; name: string | null; email: string }> = []
    for (const group of frontDoorGroups) {
      for (const member of group.members) {
        // Avoid duplicates
        if (!members.find(m => m.id === member.user.id)) {
          members.push({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
          })
        }
      }
    }

    console.log(`Found ${members.length} front desk members for building ${buildingId}`)
    return members
  } catch (error) {
    console.error('Error getting front desk members:', error)
    return []
  }
}

/**
 * Route a doorbell call to front desk after timeout
 */
export async function routeCallToFrontDesk(callSessionId: string) {
  try {
    // Get call session with doorbell and building info
    const callSession = await prisma.doorBellCallSession.findUnique({
      where: { id: callSessionId },
      include: {
        doorBell: {
          include: {
            building: true,
            household: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!callSession) {
      console.error(`Call session not found: ${callSessionId}`)
      return false
    }

    // Check if already routed
    if (callSession.status !== 'ringing') {
      console.log(`Call session ${callSessionId} is not ringing (status: ${callSession.status}), skipping routing`)
      return false
    }

    // Mark as routed to front desk
    await prisma.doorBellCallSession.update({
      where: { id: callSessionId },
      data: {
        routedToFrontDesk: true,
        routedAt: new Date(),
      },
    })

    // Get front desk members
    const frontDeskMembers = await getFrontDeskMembers(callSession.doorBell.buildingId)

    if (frontDeskMembers.length === 0) {
      console.warn(`No front desk members found for building ${callSession.doorBell.buildingId}`)
      // Still mark as routed, but no notifications sent
      return true
    }

    // Broadcast to building (front desk) realtime connections
    await broadcastDoorBellEvent(
      callSession.doorBellId,
      null, // householdId is null for front desk
      callSession.doorBell.buildingId,
      {
        type: 'routed_to_frontdesk',
        callSessionId: callSession.id,
        doorBellId: callSession.doorBellId,
        doorBellNumber: callSession.doorBell.doorBellNumber,
        householdName: callSession.doorBell.household?.name || 'Unknown',
        startedAt: callSession.startedAt,
      }
    )

    // Create notifications for front desk members
    for (const member of frontDeskMembers) {
      try {
        await createNotification({
          userId: member.id,
          title: 'Doorbell Call Routed',
          message: `Doorbell ${callSession.doorBell.doorBellNumber} (${callSession.doorBell.household?.name || 'Unknown'}) was not answered and has been routed to front desk`,
          type: 'DOOR_BELL_RUNG',
          metadata: {
            doorBellId: callSession.doorBellId,
            buildingId: callSession.doorBell.buildingId,
            callSessionId: callSession.id,
            routedToFrontDesk: true,
          },
        })
      } catch (error) {
        console.error(`Error creating notification for front desk member ${member.id}:`, error)
      }
    }

    console.log(`Successfully routed call ${callSessionId} to front desk (${frontDeskMembers.length} members notified)`)
    return true
  } catch (error) {
    console.error(`Error routing call to front desk:`, error)
    return false
  }
}

/**
 * Check and route timed-out doorbell calls
 */
export async function checkAndRouteTimedOutCalls() {
  try {
    // Get all buildings with their timeout settings
    const buildings = await prisma.building.findMany({
      select: {
        id: true,
        doorbellTimeoutSeconds: true,
      },
    })

    const now = new Date()
    let routedCount = 0

    for (const building of buildings) {
      const timeoutSeconds = building.doorbellTimeoutSeconds || 30 // Default 30 seconds
      const timeoutThreshold = new Date(now.getTime() - timeoutSeconds * 1000)

      // Find ringing calls that haven't been routed and are past timeout
      // Note: Using raw query approach to handle case where field might not exist yet
      const timedOutCalls = await prisma.doorBellCallSession.findMany({
        where: {
          doorBell: {
            buildingId: building.id,
          },
          status: 'ringing',
          startedAt: {
            lte: timeoutThreshold,
          },
        },
        select: {
          id: true,
          routedToFrontDesk: true,
        },
      }).then(calls => calls.filter(call => !call.routedToFrontDesk))

      // Route each timed-out call
      for (const call of timedOutCalls) {
        const routed = await routeCallToFrontDesk(call.id)
        if (routed) {
          routedCount++
        }
      }
    }

    if (routedCount > 0) {
      console.log(`Routed ${routedCount} timed-out doorbell calls to front desk`)
    }

    return routedCount
  } catch (error) {
    console.error('Error checking timed-out calls:', error)
    return 0
  }
}

