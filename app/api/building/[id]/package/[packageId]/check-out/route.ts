import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/building/[id]/package/[id]/check-out
 * Check out a package (mark as picked up)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; packageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const packageId = params.packageId

    // Find package
    const packageRecord = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        locker: true,
        household: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!packageRecord) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Check if user is a member of the household or building admin
    const isHouseholdMember = packageRecord.household.members.length > 0
    
    const building = await prisma.building.findUnique({
      where: { id: packageRecord.buildingId },
      include: {
        members: {
          where: { userId },
        },
      },
    })

    const isBuildingAdmin = building?.members.some(m => m.role === 'ADMIN' || m.role === 'MANAGER') || false
    const isSystemAdmin = (session.user as any).isAdmin

    if (!isHouseholdMember && !isBuildingAdmin && !isSystemAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (packageRecord.status === 'picked_up') {
      return NextResponse.json({ error: 'Package already picked up' }, { status: 400 })
    }

    // Update package
    const updated = await prisma.package.update({
      where: { id: packageId },
      data: {
        status: 'picked_up',
        checkedOutAt: new Date(),
        checkedOutBy: userId,
      },
    })

    // Free up locker
    await prisma.packageLocker.update({
      where: { id: packageRecord.lockerId },
      data: {
        isOccupied: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Package checked out successfully',
      data: updated,
    })
  } catch (error) {
    console.error('Error checking out package:', error)
    return NextResponse.json(
      { error: 'Failed to check out package' },
      { status: 500 }
    )
  }
}

