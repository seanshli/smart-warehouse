// Tuya Login Status API
// 检查 Tuya 登录状态
// Check Tuya login status

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserTuyaAccount } from '@/lib/tuya-user-manager'

export const dynamic = 'force-dynamic'

// GET: 检查 Tuya 登录状态
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check if user has Tuya account configured
    const tuyaAccount = await getUserTuyaAccount(userId)
    
    if (!tuyaAccount || !tuyaAccount.hasAccount) {
      return NextResponse.json({
        loggedIn: false,
        hasAccount: false,
        message: 'Tuya account not configured',
      })
    }

    // Note: Actual login status should be checked via native plugin
    // This endpoint just checks if account is configured
    return NextResponse.json({
      loggedIn: false, // Web fallback - actual status via native plugin
      hasAccount: true,
      tuyaAccount: tuyaAccount.tuyaAccount ? `${tuyaAccount.tuyaAccount.substring(0, 3)}****` : null,
      message: 'Use native plugin to check actual login status',
    })
  } catch (error: any) {
    console.error('Error checking Tuya login status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check login status' },
      { status: 500 }
    )
  }
}

