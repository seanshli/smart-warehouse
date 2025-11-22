// Tuya User Logout API
// 登出 Tuya 账户
// Logout from Tuya account

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST: 登出 Tuya 账户
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Clear Tuya access token
    await prisma.user.update({
      where: { id: userId },
      data: {
        tuyaAccessToken: null,
        tuyaTokenExpiresAt: null,
      },
    })

    // Note: Actual logout should be done via native plugin
    // This just clears the server-side token
    return NextResponse.json({
      success: true,
      message: 'Tuya logout successful. Token cleared.',
    })
  } catch (error: any) {
    console.error('Error in Tuya logout:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to logout from Tuya account' },
      { status: 500 }
    )
  }
}

