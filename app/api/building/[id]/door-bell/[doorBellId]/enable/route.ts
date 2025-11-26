import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingManagement } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/building/[id]/door-bell/[doorBellId]/enable
 * Enable or disable a door bell (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; doorBellId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const doorBellId = params.doorBellId
    const { isEnabled } = await request.json()

    // Find door bell
    const doorBell = await prisma.doorBell.findUnique({
      where: { id: doorBellId },
      include: {
        building: true,
      },
    })

    if (!doorBell) {
      return NextResponse.json({ error: 'Door bell not found' }, { status: 404 })
    }

    // Check if user has permission to manage this building
    const hasAccess = await checkBuildingManagement(userId, doorBell.buildingId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update door bell
    const updated = await prisma.doorBell.update({
      where: { id: doorBellId },
      data: {
        isEnabled: isEnabled ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Door bell ${isEnabled ? 'enabled' : 'disabled'}`,
      data: updated,
    })
  } catch (error) {
    console.error('Error updating door bell:', error)
    return NextResponse.json(
      { error: 'Failed to update door bell' },
      { status: 500 }
    )
  }
}

