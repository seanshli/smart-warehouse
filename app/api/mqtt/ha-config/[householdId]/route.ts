import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getHAConfigForMQTT } from '@/lib/mqtt/ha-config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mqtt/ha-config/[householdId]
 * Get Home Assistant configuration for MQTT integration
 * This endpoint is used by MQTT system to get HA server details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ householdId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { householdId } = await params

    // Verify user has access to this household
    const { prisma } = await import('@/lib/prisma')
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: (session.user as any).id,
          householdId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get HA config for MQTT
    const config = await getHAConfigForMQTT(householdId)

    if (!config) {
      return NextResponse.json({
        success: true,
        config: null,
        message: 'No Home Assistant configuration found for this household',
      })
    }

    return NextResponse.json({
      success: true,
      config: {
        householdId: config.householdId,
        baseUrl: config.baseUrl,
        username: config.username,
        serverIp: config.serverIp,
        // Include accessToken for MQTT system use
        accessToken: config.accessToken,
      },
    })
  } catch (error: any) {
    console.error('Error fetching HA config for MQTT:', error)
    return NextResponse.json(
      { error: 'Failed to fetch HA config', details: error.message },
      { status: 500 }
    )
  }
}

