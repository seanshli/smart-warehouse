import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/package
 * List all packages for a building
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

    const buildingId = params.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Filter by status: pending, picked_up, expired

    // Check if user has access to this building
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        members: {
          where: { userId: (session.user as any).id },
        },
        community: {
          include: {
            members: {
              where: { userId: (session.user as any).id },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const buildingId = params.id
    const body = await request.json()
    const { lockerId, householdId, packageNumber, description } = body

    if (!lockerId || !householdId) {
      return NextResponse.json(
        { error: 'lockerId and householdId are required' },
        { status: 400 }
      )
    }

    // Check if user has management access to this building
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        members: {
          where: { userId },
        },
        community: {
          include: {
            members: {
              where: { userId },
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

    // Create notifications for all household members
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
      notificationsSent: notifications.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error creating package:', error)
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    )
  }
}


