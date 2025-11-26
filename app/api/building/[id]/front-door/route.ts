import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkBuildingAccess, checkBuildingManagement } from '@/lib/middleware/community-permissions'
import { getFrontDoorSummary, syncFrontDoorFeatures } from '@/lib/building/front-door'

export const dynamic = 'force-dynamic'

export async function GET(
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

    if (!(await checkBuildingAccess(userId, buildingId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const summary = await getFrontDoorSummary(buildingId)
    return NextResponse.json({ success: true, data: summary })
  } catch (error) {
    console.error('Error fetching front door summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch front door summary' },
      { status: 500 }
    )
  }
}

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
    const hasAccess = await checkBuildingManagement(userId, buildingId)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { packageLockerCount } = await request.json().catch(() => ({}))
    const result = await syncFrontDoorFeatures(buildingId, { packageLockerCount })

    return NextResponse.json({
      success: true,
      message: 'Front door facilities synced successfully',
      data: result,
    })
  } catch (error) {
    console.error('Error syncing front door facilities:', error)
    return NextResponse.json(
      { error: 'Failed to sync front door facilities' },
      { status: 500 }
    )
  }
}

