import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingManagement } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; facilityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const buildingId = params.id
    const facilityId = params.facilityId

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    })

    if (!facility || facility.buildingId !== buildingId) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    if (!(await checkBuildingManagement(userId, buildingId))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    await prisma.facility.delete({
      where: { id: facilityId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting facility:', error)
    return NextResponse.json(
      { error: 'Failed to delete facility' },
      { status: 500 }
    )
  }
}

