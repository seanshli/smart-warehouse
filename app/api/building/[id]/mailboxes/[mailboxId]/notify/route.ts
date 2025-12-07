import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingManagement } from '@/lib/middleware/community-permissions'
import { createNotification } from '@/lib/notifications'
import { createReceptionAnnouncement, logReceptionActivity, findReceptionHousehold } from '@/lib/reception-household'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/mailboxes/[mailboxId]/notify
 * Notify household members when building manager marks mail as received
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; mailboxId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const buildingId = params.id
    const mailboxId = params.mailboxId

    // Check if user has access to manage this building
    const hasAccess = await checkBuildingManagement(userId, buildingId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get mailbox with household and members
    const mailbox = await prisma.mailbox.findUnique({
      where: { id: mailboxId },
      include: {
        household: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        building: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
    }

    if (mailbox.buildingId !== buildingId) {
      return NextResponse.json({ error: 'Mailbox does not belong to this building' }, { status: 400 })
    }

    if (!mailbox.household) {
      return NextResponse.json({ error: 'Mailbox is not linked to a household' }, { status: 400 })
    }

    // Update mailbox to indicate mail has been received
    const updatedMailbox = await prisma.mailbox.update({
      where: { id: mailboxId },
      data: {
        hasMail: true,
        lastMailAt: new Date(),
      },
    })

    // Create announcement for reception household only (not broadcast to mailbox owner)
    let announcement = null
    try {
      const receptionHouseholdId = await findReceptionHousehold(buildingId)
      if (receptionHouseholdId) {
        announcement = await createReceptionAnnouncement(
          buildingId,
          '📬 郵件通知',
          `郵箱 ${mailbox.mailboxNumber}${mailbox.household.apartmentNo ? ` (${mailbox.household.apartmentNo})` : ''} 有新的郵件。住戶：${mailbox.household.name}`,
          userId,
          {
            mailboxId: mailbox.id,
            mailboxNumber: mailbox.mailboxNumber,
            householdId: mailbox.household.id,
            householdName: mailbox.household.name,
            apartmentNo: mailbox.household.apartmentNo,
            buildingName: mailbox.building.name,
          }
        )
        
        // Log activity for reception household
        await logReceptionActivity(
          userId,
          receptionHouseholdId,
          'mail',
          'mail_received',
          `Mail received for mailbox ${mailbox.mailboxNumber}${mailbox.household.apartmentNo ? ` (${mailbox.household.apartmentNo})` : ''} - ${mailbox.household.name}`,
          {
            mailboxId: mailbox.id,
            mailboxNumber: mailbox.mailboxNumber,
            householdId: mailbox.household.id,
            householdName: mailbox.household.name,
            apartmentNo: mailbox.household.apartmentNo,
            buildingName: mailbox.building.name,
          }
        )
      } else {
        console.warn(`[Mailbox] Reception household not found for building ${buildingId}, skipping announcement`)
      }
    } catch (announcementError) {
      console.error('Error creating reception announcement:', announcementError)
      // Continue even if announcement creation fails
    }

    // Create notifications for mailbox owner household members (not broadcast)
    const notifications = []
    for (const member of mailbox.household.members) {
      try {
        const notification = await createNotification({
          type: 'MAIL_RECEIVED',
          title: '📬 您有郵件',
          message: `您的郵箱 ${mailbox.mailboxNumber} 有新的郵件。請到公共區域領取。`,
          userId: member.userId,
          householdId: mailbox.household.id,
          metadata: {
            mailboxId: mailbox.id,
            mailboxNumber: mailbox.mailboxNumber,
            buildingName: mailbox.building.name,
          },
        })
        notifications.push(notification)
      } catch (error) {
        console.error(`Failed to create notification for user ${member.userId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Announcement sent to reception and notifications sent to ${notifications.length} household member(s)`,
      data: {
        mailbox: updatedMailbox,
        announcementCreated: !!announcement,
        notificationsSent: notifications.length,
      },
    })
  } catch (error) {
    console.error('Error notifying household about mail:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}

