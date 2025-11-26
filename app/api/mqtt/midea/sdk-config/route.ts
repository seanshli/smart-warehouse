import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Get Midea SDK configuration for native clients
 * Returns credentials needed to initialize MSmartSDK
 */
export async function GET(request: NextRequest) {
  try {
    const platform = request.nextUrl.searchParams.get('platform') || 'android'

    // Get credentials from environment variables
    const clientId = process.env.MIDEA_CLIENT_ID
    const clientSecret = process.env.MIDEA_CLIENT_SECRET
    const serverHost = process.env.MIDEA_SERVER_HOST || 'https://obm.midea.com'
    const clientSrc = process.env.MIDEA_CLIENT_SRC || ''

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: 'Midea SDK credentials not configured',
          message: 'Please set MIDEA_CLIENT_ID and MIDEA_CLIENT_SECRET in environment variables',
        },
        { status: 500 }
      )
    }

    // Note: Access token should be obtained from user login
    // This endpoint only returns static credentials
    return NextResponse.json({
      clientId,
      clientSecret,
      serverHost,
      clientSrc,
      platform,
      // Access token should be obtained separately via user login
      // accessToken: 'Bearer ...' // Will be set after user login
    })
  } catch (error: any) {
    console.error('Failed to get Midea SDK config:', error)
    return NextResponse.json(
      {
        error: 'Failed to get Midea SDK configuration',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

