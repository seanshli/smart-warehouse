// 通知 API 路由（標記所有為已讀）
// 將用戶的所有未讀通知標記為已讀

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// PATCH 處理器：標記所有通知為已讀
export async function PATCH() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 獲取用戶的家庭
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: (session?.user as any)?.id
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // 將用戶的所有未讀通知標記為已讀
    await prisma.notification.updateMany({
      where: {
        userId: (session?.user as any)?.id, // 用戶 ID
        read: false // 僅更新未讀通知
      },
      data: {
        read: true // 標記為已讀
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}


