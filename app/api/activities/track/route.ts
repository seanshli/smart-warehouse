// 活動追蹤 API 路由
// 從前端追蹤用戶活動，允許前端記錄活動而不阻塞主要流程

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { trackActivity, createActivityDescription, ActivityType, ActivityAction } from '@/lib/activity-tracker'

export const dynamic = 'force-dynamic'

/**
 * API 端點：從前端追蹤用戶活動
 * 此端點允許前端記錄活動而不阻塞主要流程
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()

    const {
      householdId, // 家庭 ID
      activityType, // 活動類型
      action, // 活動操作
      description, // 活動描述（可選）
      metadata, // 額外元資料（可選）
      itemId, // 物品 ID（可選）
      roomId, // 房間 ID（可選）
      cabinetId, // 櫃子 ID（可選）
      categoryId // 分類 ID（可選）
    } = body

    // 驗證必填欄位
    if (!householdId || !activityType || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: householdId, activityType, action' },
        { status: 400 }
      )
    }

    // 驗證用戶有權限存取此家庭
    const household = await prisma.household.findFirst({
      where: {
        id: householdId,
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found or access denied' }, { status: 403 })
    }

    // 如果未提供描述，則創建描述
    const finalDescription = description || createActivityDescription(
      activityType as ActivityType,
      action as ActivityAction,
      metadata
    )

    // 追蹤活動
    await trackActivity({
      userId, // 用戶 ID
      householdId, // 家庭 ID
      activityType: activityType as ActivityType, // 活動類型
      action: action as ActivityAction, // 活動操作
      description: finalDescription, // 活動描述
      metadata, // 元資料
      itemId, // 物品 ID
      roomId, // 房間 ID
      cabinetId, // 櫃子 ID
      categoryId // 分類 ID
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking activity:', error)
    return NextResponse.json(
      { error: 'Failed to track activity' },
      { status: 500 }
    )
  }
}

