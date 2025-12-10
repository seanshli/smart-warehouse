/**
 * Home Assistant to MQTT Sync API
 * Manually trigger sync of Home Assistant entities to MQTT
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { initializeHASync, syncAllEntitiesToMQTT } from '@/lib/mqtt/homeassistant-sync'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mqtt/homeassistant/sync
 * Trigger sync of Home Assistant entities to MQTT
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { householdId } = body

    if (!householdId) {
      return NextResponse.json({ error: 'householdId is required' }, { status: 400 })
    }

    // Verify user has access to this household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if Home Assistant is configured
    const haConfig = await prisma.homeAssistantConfig.findUnique({
      where: { householdId },
    })

    if (!haConfig) {
      return NextResponse.json(
        { error: 'Home Assistant is not configured for this household' },
        { status: 404 }
      )
    }

    // Trigger sync (initialize will sync all entities and start listening)
    try {
      await initializeHASync(householdId)
      return NextResponse.json({
        success: true,
        message: 'Home Assistant sync initialized successfully',
      })
    } catch (syncError: any
      // If initialization fails, try just syncing entities (without listener)
      try {
        await syncAllEntitiesToMQTT(householdId)
        return NextResponse.json({
          success: true,
          message: 'Home Assistant entities synced to MQTT (state listener may not be active)',
          warning: 'State change listener could not be started',
        })
      } catch (error) {
        console.error('[HA Sync API] Sync error:', error)
        return NextResponse.json(
          {
            error: 'Failed to sync Home Assistant entities',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('[HA Sync API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger sync', details: error.message },
      { status: 500 }
    )
  }
}
