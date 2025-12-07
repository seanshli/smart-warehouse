import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingManagement } from '@/lib/middleware/community-permissions'
import { createReceptionAnnouncement, logReceptionActivity, findReceptionHousehold } from '@/lib/reception-household'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/package/check-in
 * Check in a package to a locker
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

    const userId = (session.user as any).id
    const buildingId = params.id
    const { lockerId, householdId, packageNumber, description } = await request.json()

    if (!lockerId || !householdId) {
      return NextResponse.json(
        { error: 'Locker ID and household ID are required' },
        { status: 400 }
      )
    }

    // Check if user has permission to manage this building
    const hasAccess = await checkBuildingManagement(userId, buildingId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if locker exists and is available
    const locker = await prisma.packageLocker.findUnique({
      where: { id: lockerId },
    })

    if (!locker) {
      return NextResponse.json({ error: 'Locker not found' }, { status: 404 })
    }

    if (locker.buildingId !== buildingId) {
      return NextResponse.json({ error: 'Locker does not belong to this building' }, { status: 400 })
    }

    if (locker.isOccupied) {
      return NextResponse.json({ error: 'Locker is already occupied' }, { status: 400 })
    }

    // Check if household exists
    const household = await prisma.household.findUnique({
      where: { id: householdId },
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

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Create package record
    const packageRecord = await prisma.package.create({
      data: {
        buildingId,
        lockerId,
        householdId,
        packageNumber: packageNumber || null,
        description: description || null,
        checkedInBy: userId,
        status: 'pending',
      },
    })

    // Update locker status
    await prisma.packageLocker.update({
      where: { id: lockerId },
      data: {
        isOccupied: true,
      },
    })

    // Create announcement for reception household only (not broadcast)
    let announcement = null
    try {
      const receptionHouseholdId = await findReceptionHousehold(buildingId)
      if (receptionHouseholdId) {
        announcement = await createReceptionAnnouncement(
          buildingId,
          '📦 包裹通知',
          `包裹已登記：儲物櫃 #${locker.lockerNumber}${packageNumber ? ` (追蹤號碼: ${packageNumber})` : ''}${household.apartmentNo ? ` - ${household.apartmentNo}` : ''} - ${household.name}${description ? ` (${description})` : ''}`,
          userId,
          {
            packageId: packageRecord.id,
            lockerId: locker.id,
            lockerNumber: locker.lockerNumber,
            householdId: household.id,
            householdName: household.name,
            apartmentNo: household.apartmentNo,
            packageNumber,
            description,
          }
        )
        
        // Log activity for reception household
        await logReceptionActivity(
          userId,
          receptionHouseholdId,
          'package',
          'package_received',
          `Package received: Locker #${locker.lockerNumber}${packageNumber ? ` (${packageNumber})` : ''}${household.apartmentNo ? ` - ${household.apartmentNo}` : ''} - ${household.name}`,
          {
            packageId: packageRecord.id,
            lockerId: locker.id,
            lockerNumber: locker.lockerNumber,
            householdId: household.id,
            householdName: household.name,
            apartmentNo: household.apartmentNo,
            packageNumber,
            description,
          }
        )
      } else {
        console.warn(`[Package Check-in] Reception household not found for building ${buildingId}, skipping announcement`)
      }
    } catch (announcementError) {
      console.error('Error creating reception announcement:', announcementError)
      // Continue even if announcement creation fails
    }

    // Create notifications for package owner household members (not broadcast)
    const notifications = []
    for (const member of household.members) {
      try {
        const notification = await prisma.notification.create({
          data: {
            type: 'PACKAGE_RECEIVED',
            title: 'Package Received',
            message: `You have a package in locker ${locker.lockerNumber}${packageNumber ? ` (${packageNumber})` : ''}`,
            userId: member.user.id,
            packageId: packageRecord.id,
          },
        })
        notifications.push(notification)
      } catch (error) {
        console.error(`Failed to create notification for user ${member.user.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Package checked in successfully',
      data: {
        package: packageRecord,
        locker: {
          id: locker.id,
          lockerNumber: locker.lockerNumber,
          isOccupied: true,
        },
        announcementCreated: !!announcement,
        notificationsSent: notifications.length,
      },
    })
  } catch (error) {
    console.error('Error checking in package:', error)
    return NextResponse.json(
      { error: 'Failed to check in package' },
      { status: 500 }
    )
  }
}


