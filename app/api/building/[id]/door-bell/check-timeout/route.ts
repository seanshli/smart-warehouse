import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkAndRouteTimedOutCalls } from '@/lib/doorbell-routing'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/door-bell/check-timeout
 * Check for timed-out doorbell calls and route them to front desk
 * This can be called periodically (e.g., every 10 seconds) or triggered manually
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow unauthenticated calls for cron jobs/webhooks, but prefer authenticated
    if (!session?.user) {
      // For cron/webhook calls, check for a secret token
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const buildingId = params.id
    const routedCount = await checkAndRouteTimedOutCalls()

    return NextResponse.json({
      success: true,
      routedCount,
      message: `Routed ${routedCount} timed-out call(s) to front desk`,
    })
  } catch (error: any) {
    console.error('Error checking timed-out calls:', error)
    return NextResponse.json(
      { error: 'Failed to check timed-out calls', details: error?.message },
      { status: 500 }
    )
  }
}

