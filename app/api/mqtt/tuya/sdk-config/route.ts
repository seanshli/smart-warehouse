import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to provide Tuya SDK credentials to native clients
 * 
 * This endpoint is safe to expose as the credentials are meant to be embedded
 * in the mobile app. They are different from the cloud API credentials.
 * 
 * GET /api/mqtt/tuya/sdk-config
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') || 'ios' // 'ios' or 'android'

    let appKey: string | undefined
    let appSecret: string | undefined
    let sha256: string | undefined

    if (platform === 'android') {
      // Get Android SDK credentials from environment variables
      appKey = process.env.TUYA_ANDROID_SDK_APP_KEY
      appSecret = process.env.TUYA_ANDROID_SDK_APP_SECRET
      sha256 = process.env.TUYA_ANDROID_SDK_SHA256

      // Check if credentials are available
      if (!appKey || !appSecret) {
        return NextResponse.json(
          {
            error: 'Tuya Android SDK credentials not configured',
            message: 'Please set TUYA_ANDROID_SDK_APP_KEY and TUYA_ANDROID_SDK_APP_SECRET environment variables',
          },
          { status: 500 }
        )
      }

      // Return credentials (safe to expose as they're for app embedding)
      return NextResponse.json({
        appKey,
        appSecret,
        sha256: sha256 || null,
      })
    } else {
      // Get iOS SDK credentials from environment variables
      appKey = process.env.TUYA_IOS_SDK_APP_KEY
      appSecret = process.env.TUYA_IOS_SDK_APP_SECRET

      // Check if credentials are available
      if (!appKey || !appSecret) {
        return NextResponse.json(
          {
            error: 'Tuya iOS SDK credentials not configured',
            message: 'Please set TUYA_IOS_SDK_APP_KEY and TUYA_IOS_SDK_APP_SECRET environment variables',
          },
          { status: 500 }
        )
      }

      // Return credentials (safe to expose as they're for app embedding)
      return NextResponse.json({
        appKey,
        appSecret,
      })
    }
  } catch (error) {
    console.error('Error fetching Tuya SDK config:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Tuya SDK configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

