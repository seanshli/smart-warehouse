// 通知 API 路由（單個通知）
// 更新單個通知的狀態（標記為已讀/未讀）

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// PATCH 處理器：更新通知狀態
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { isRead } = body // 是否已讀

    // 更新通知狀態（僅更新屬於當前用戶的通知）
    const notification = await prisma.notification.updateMany({
      where: {
        id: params.id, // 通知 ID
        userId: (session?.user as any)?.id // 用戶 ID（確保只能更新自己的通知）
      },
      data: {
        read: isRead // 更新已讀狀態
      }
    })

    if (notification.count === 0) {
      return NextResponse.json(
        { error: 'Notification not found' }, // 通知不存在或無權限
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}


