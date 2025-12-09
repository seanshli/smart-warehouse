import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/line/user
 * 獲取當前用戶的 LINE 綁定狀態
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // 查找用戶的 LINE 綁定
    const lineUser = await prisma.lineUser.findUnique({
      where: { userId },
      select: {
        lineUserId: true,
        displayName: true,
        pictureUrl: true,
      },
    })

    return NextResponse.json({ 
      success: true,
      lineUser: lineUser || null,
    })
  } catch (error: any) {
    console.error('Error fetching LINE user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LINE user', details: error.message },
      { status: 500 }
    )
  }
}

