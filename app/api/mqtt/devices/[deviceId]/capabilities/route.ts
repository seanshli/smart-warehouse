// API endpoint for device capabilities (DPs)
// 獲取設備能力/數據點定義
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dpManager, VENDOR_DPS } from '@/lib/iot-dp'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mqtt/devices/[deviceId]/capabilities
 * Get device capabilities (DPs) for a specific device
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { deviceId } = params

    // Try to get cached capabilities first
    let capabilities = dpManager.getCapabilities(deviceId)
    
    if (!capabilities) {
      // Try to get device info from database
      const device = await prisma.ioTDevice.findFirst({
        where: {
          OR: [
            { id: deviceId },
            { deviceId: deviceId },
          ],
        },
        select: {
          id: true,
          deviceId: true,
          name: true,
          vendor: true,
          category: true,
          model: true,
        },
      })

      if (device) {
        // Register from predefined definitions
        capabilities = dpManager.registerFromPredefined(
          device.deviceId || device.id,
          device.vendor || 'generic',
          device.category || 'generic'
        )
      }
    }

    if (capabilities) {
      return NextResponse.json({
        success: true,
        deviceId,
        capabilities: {
          vendor: capabilities.vendor,
          category: capabilities.category,
          categoryName: capabilities.categoryName,
          source: capabilities.source,
          discoveredAt: capabilities.discoveredAt.toISOString(),
          dps: capabilities.dps,
        },
      })
    }

    // Return generic capabilities if nothing found
    return NextResponse.json({
      success: true,
      deviceId,
      capabilities: null,
      message: 'No capabilities found for this device. Device may need to announce its capabilities.',
    })
  } catch (error: any) {
    console.error('Error fetching device capabilities:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch device capabilities' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mqtt/devices/[deviceId]/capabilities
 * Register device capabilities manually or from announcement
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { deviceId } = params
    const body = await request.json()
    const { vendor, category, model, dps, source } = body

    if (!vendor) {
      return NextResponse.json(
        { error: 'vendor is required' },
        { status: 400 }
      )
    }

    let capabilities

    if (source === 'announcement' || dps) {
      // Register from device announcement with custom DPs
      capabilities = dpManager.registerFromAnnouncement(deviceId, vendor, {
        category,
        model,
        dps,
      })
    } else {
      // Register from predefined definitions
      capabilities = dpManager.registerFromPredefined(deviceId, vendor, category || 'generic')
    }

    if (capabilities) {
      return NextResponse.json({
        success: true,
        deviceId,
        capabilities: {
          vendor: capabilities.vendor,
          category: capabilities.category,
          categoryName: capabilities.categoryName,
          source: capabilities.source,
          discoveredAt: capabilities.discoveredAt.toISOString(),
          dps: capabilities.dps,
        },
      })
    }

    return NextResponse.json(
      { error: 'Failed to register capabilities' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error registering device capabilities:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to register device capabilities' },
      { status: 500 }
    )
  }
}
