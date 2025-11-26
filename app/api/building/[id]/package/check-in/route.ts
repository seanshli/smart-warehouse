import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingManagement } from '@/lib/middleware/community-permissions'

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

    // Create notifications for all household members
    const notifications = []
    for (const member of household.members) {
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

