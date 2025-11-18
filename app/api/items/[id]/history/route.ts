// 物品歷史 API 路由
// 獲取物品的所有操作歷史記錄，包括創建、更新、移動、取出等操作

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { trackActivity } from '@/lib/activity-tracker'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// GET 處理器：獲取物品歷史記錄
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const itemId = params.id // 物品 ID

    // 驗證用戶有權限存取此物品
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        household: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // 獲取此物品的所有活動記錄
    const activities = await prisma.itemHistory.findMany({
      where: {
        itemId: itemId // 物品 ID
      },
      include: {
        performer: true, // 包含執行者資訊
        oldRoom: true, // 包含舊房間資訊（移動操作）
        newRoom: true, // 包含新房間資訊（移動操作）
        oldCabinet: true, // 包含舊櫃子資訊（移動操作）
        newCabinet: true // 包含新櫃子資訊（移動操作）
      },
      orderBy: {
        createdAt: 'desc' // 按創建時間降序排序（最新的在前）
      }
    })

    // 追蹤物品歷史查看活動（非阻塞）
    trackActivity({
      userId,
      householdId: item.householdId,
      activityType: 'view_item',
      action: 'view_item_history',
      description: `Viewed history for item: ${item.name}`,
      metadata: {
        itemName: item.name,
        historyCount: activities.length // 歷史記錄數量
      },
      itemId: item.id
    }).catch(err => console.error('Failed to track item history view activity:', err))

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching item history:', error)
    return NextResponse.json({ error: 'Failed to fetch item history' }, { status: 500 })
  }
}