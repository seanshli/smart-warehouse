import { NextRequest, NextResponse } from 'next/server'
import { createTuyaProvisioning } from '@/lib/tuya-provisioning'

export const dynamic = 'force-dynamic'

/**
 * Test Tuya API Configuration
 * GET /api/test/tuya-config
 */
export async function GET(request: NextRequest) {
  try {
    const accessId = process.env.TUYA_ACCESS_ID
    const accessSecret = process.env.TUYA_ACCESS_SECRET
    const region = process.env.TUYA_REGION || 'cn'

    const config = {
      tuyaConfigured: !!(accessId && accessSecret),
      hasAccessId: !!accessId,
      hasAccessSecret: !!accessSecret,
      region,
      accessIdLength: accessId?.length || 0,
      accessSecretLength: accessSecret?.length || 0,
    }

    // Try to get a provisioning token to verify credentials
    if (config.tuyaConfigured) {
      try {
        const provisioning = createTuyaProvisioning({
          accessId: accessId!,
          accessSecret: accessSecret!,
          region: region as 'cn' | 'us' | 'eu',
          ssid: 'test',
          password: 'test',
        })

        const token = await provisioning.getProvisioningToken()
        return NextResponse.json({
          ...config,
          credentialsValid: true,
          tokenReceived: !!token,
          message: 'Tuya credentials are valid and working',
        })
      } catch (error: any) {
        return NextResponse.json({
          ...config,
          credentialsValid: false,
          error: error.message || 'Failed to verify credentials',
          details: error.toString(),
          message: 'Tuya credentials are configured but invalid. Please check TUYA_ACCESS_ID and TUYA_ACCESS_SECRET.',
        }, { status: 400 })
      }
    }

    return NextResponse.json({
      ...config,
      credentialsValid: false,
      message: 'Tuya credentials are not configured. Please set TUYA_ACCESS_ID and TUYA_ACCESS_SECRET environment variables.',
    }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to test Tuya configuration',
      details: error.message || error.toString(),
    }, { status: 500 })
  }
}

