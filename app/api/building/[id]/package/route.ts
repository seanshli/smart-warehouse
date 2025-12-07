import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createReceptionAnnouncement, logReceptionActivity, findReceptionHousehold } from '@/lib/reception-household'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/package
 * List all packages for a building
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const buildingId = resolvedParams.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Filter by status: pending, picked_up, expired

    // Check if user has access to this building
    // Use select instead of include to avoid implicit memberClass queries
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: {
        id: true,
        members: {
          where: { userId: (session.user as any).id },
          select: {
            id: true,
            userId: true,
            buildingId: true,
          },
        },
        community: {
          select: {
            id: true,
            members: {
              where: { userId: (session.user as any).id },
              select: {
                id: true,
                userId: true,
                communityId: true,
              },
            },
          },
        },
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    // Check access
    const hasAccess = building.members.length > 0 || 
                     building.community.members.length > 0 ||
                     (session.user as any).isAdmin

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const where: any = { buildingId }
    if (status) {
      where.status = status
    }

    const packages = await prisma.package.findMany({
      where,
      include: {
        locker: {
          select: {
            id: true,
            lockerNumber: true,
          },
        },
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true,
          },
        },
      },
      orderBy: {
        checkedInAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, data: packages })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/building/[id]/package
 * Create a new package assignment (check-in)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const buildingId = resolvedParams.id
    const body = await request.json()
    const { lockerId, householdId, packageNumber, description } = body

    if (!lockerId || !householdId) {
      return NextResponse.json(
        { error: 'lockerId and householdId are required' },
        { status: 400 }
      )
    }

    // Check if user has management access to this building
    // Use select instead of include to avoid implicit memberClass queries
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: {
        id: true,
        members: {
          where: { userId },
          select: {
            id: true,
            userId: true,
            buildingId: true,
            role: true,
          },
        },
        community: {
          select: {
            id: true,
            members: {
              where: { userId },
              select: {
                id: true,
                userId: true,
                communityId: true,
                role: true,
              },
            },
          },
        },
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    // Check if user is building admin/manager or super admin
    const isBuildingAdmin = building.members.some(
      m => m.role === 'ADMIN' || m.role === 'MANAGER'
    )
    const isCommunityAdmin = building.community.members.some(
      m => m.role === 'ADMIN' || m.role === 'MANAGER'
    )
    const isSuperAdmin = (session.user as any).isAdmin

    if (!isBuildingAdmin && !isCommunityAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if locker exists and is available
    const locker = await prisma.packageLocker.findUnique({
      where: { id: lockerId },
      include: {
        packages: {
          where: {
            status: 'pending',
          },
        },
      },
    })

    if (!locker || locker.buildingId !== buildingId) {
      return NextResponse.json({ error: 'Locker not found' }, { status: 404 })
    }

    if (locker.packages.length > 0) {
      return NextResponse.json(
        { error: 'Locker is already occupied' },
        { status: 400 }
      )
    }

    // Verify household exists and belongs to this building
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!household || household.buildingId !== buildingId) {
      return NextResponse.json({ error: 'Household not found or not in this building' }, { status: 404 })
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
      include: {
        locker: {
          select: {
            id: true,
            lockerNumber: true,
          },
        },
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true,
          },
        },
      },
    })

    // Mark locker as occupied
    await prisma.packageLocker.update({
      where: { id: lockerId },
      data: { isOccupied: true },
    })

    // Create announcement for reception household only (not broadcast)
    let announcement = null
    try {
      const receptionHouseholdId = await findReceptionHousehold(buildingId)
      if (receptionHouseholdId) {
        announcement = await createReceptionAnnouncement(
          buildingId,
          '📦 包裹通知',
          `包裹已登記：儲物櫃 #${locker.lockerNumber}${packageNumber ? ` (追蹤號碼: ${packageNumber})` : ''}${packageRecord.household.apartmentNo ? ` - ${packageRecord.household.apartmentNo}` : ''} - ${packageRecord.household.name}${description ? ` (${description})` : ''}`,
          userId,
          {
            packageId: packageRecord.id,
            lockerId: locker.id,
            lockerNumber: locker.lockerNumber,
            householdId: packageRecord.household.id,
            householdName: packageRecord.household.name,
            apartmentNo: packageRecord.household.apartmentNo,
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
          `Package received: Locker #${locker.lockerNumber}${packageNumber ? ` (${packageNumber})` : ''}${packageRecord.household.apartmentNo ? ` - ${packageRecord.household.apartmentNo}` : ''} - ${packageRecord.household.name}`,
          {
            packageId: packageRecord.id,
            lockerId: locker.id,
            lockerNumber: locker.lockerNumber,
            householdId: packageRecord.household.id,
            householdName: packageRecord.household.name,
            apartmentNo: packageRecord.household.apartmentNo,
            packageNumber,
            description,
          }
        )
      } else {
        console.warn(`[Package] Reception household not found for building ${buildingId}, skipping announcement`)
      }
    } catch (announcementError) {
      console.error('Error creating reception announcement:', announcementError)
      // Continue even if announcement creation fails
    }

    // Create notifications for package owner household members (not broadcast)
    const { createNotification } = await import('@/lib/notifications')
    const notifications = []
    const errors = []
    
    console.log(`[Package Check-in] Creating notifications for household ${householdId} with ${household.members.length} members`)
    
    for (const member of household.members) {
      try {
        console.log(`[Package Check-in] Creating notification for user ${member.userId} (${member.user?.email || 'no email'})`)
        const notification = await createNotification({
          type: 'PACKAGE_RECEIVED',
          title: 'Package Received',
          message: `You have a package in locker #${locker.lockerNumber}${packageNumber ? ` (Tracking: ${packageNumber})` : ''}`,
          userId: member.userId,
          householdId,
          metadata: {
            packageId: packageRecord.id,
          },
        })
        notifications.push(notification)
        console.log(`[Package Check-in] Notification created successfully for user ${member.userId}`)
      } catch (error) {
        console.error(`[Package Check-in] Failed to create notification for user ${member.userId}:`, error)
        errors.push({ userId: member.userId, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    if (errors.length > 0) {
      console.error(`[Package Check-in] ${errors.length} notification(s) failed to create:`, errors)
    }

    return NextResponse.json({
      success: true,
      data: packageRecord,
      announcementCreated: !!announcement,
      notificationsSent: notifications.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error creating package:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error?.code || 'UNKNOWN'
    
    // Log Prisma-specific errors
    if (error?.code) {
      console.error('Prisma error code:', error.code)
      console.error('Prisma error meta:', error.meta)
      console.error('Prisma error message:', error.message)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create package',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    )
  }
}


