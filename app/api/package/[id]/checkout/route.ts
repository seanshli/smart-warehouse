import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/package/[id]/checkout
 * Check out a package (mark as picked up, free the locker)
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
    const packageId = params.id

    // Get package with related data
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

    // Check if user is a member of the household
    if (packageRecord.household.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this household' },
        { status: 403 }
      )
    }

    if (packageRecord.status === 'picked_up') {
      return NextResponse.json(
        { error: 'Package already checked out' },
        { status: 400 }
      )
    }

    // Update package status
    await prisma.package.update({
      where: { id: packageId },
      data: {
        status: 'picked_up',
        checkedOutAt: new Date(),
        checkedOutBy: userId,
      },
    })

    // Check if there are any other pending packages in this locker
    const otherPendingPackages = await prisma.package.count({
      where: {
        lockerId: packageRecord.lockerId,
        status: 'pending',
        id: { not: packageId },
      },
    })

    // Free the locker if no other pending packages
    if (otherPendingPackages === 0) {
      await prisma.packageLocker.update({
        where: { id: packageRecord.lockerId },
        data: { isOccupied: false },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Package checked out successfully',
    })
  } catch (error) {
    console.error('Error checking out package:', error)
    return NextResponse.json(
      { error: 'Failed to check out package' },
      { status: 500 }
    )
  }
}

