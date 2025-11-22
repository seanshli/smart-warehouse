// Tuya User Login API
// 使用用户的 Tuya 账户登录
// Login with user's Tuya account

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserTuyaCredentials, verifyTuyaPassword } from '@/lib/tuya-user-manager'

export const dynamic = 'force-dynamic'

// POST: 使用用户的 Tuya 账户登录
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    
    // If credentials provided, verify them
    if (body.password) {
      const isValid = await verifyTuyaPassword(userId, body.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid Tuya password' },
          { status: 401 }
        )
      }
    }

    // Get user's Tuya credentials
    const credentials = await getUserTuyaCredentials(userId)
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'Tuya account not configured. Please set up your Tuya account first.' },
        { status: 400 }
      )
    }

    // Return credentials for native SDK login
    // Note: Password should be provided by the user or retrieved securely
    // The native plugin will handle the actual login with the password
    return NextResponse.json({
      success: true,
      countryCode: credentials.tuyaCountryCode,
      account: credentials.tuyaAccount,
      hasPassword: credentials.hasPassword,
      message: 'Tuya credentials retrieved. Use these to login via native SDK. Password should be provided separately.',
    })
  } catch (error: any) {
    console.error('Error in Tuya login:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to login with Tuya account' },
      { status: 500 }
    )
  }
}

// GET: 检查登录状态
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // This endpoint is mainly for web fallback
    // Native platforms should use the plugin's isLoggedIn() method
    return NextResponse.json({
      loggedIn: false, // Web fallback always returns false
      message: 'Use native plugin to check login status',
    })
  } catch (error: any) {
    console.error('Error checking Tuya login status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check login status' },
      { status: 500 }
    )
  }
}

