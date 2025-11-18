// 通知 API 路由
// 獲取用戶的通知列表（低庫存警告、物品變更通知等）

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// GET 處理器：獲取通知列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId') // 家庭 ID

    let household

    if (householdId) {
      // 如果提供了家庭 ID，驗證用戶有權限存取
      household = await prisma.household.findFirst({
        where: {
          id: householdId,
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    } else {
      // 獲取用戶的第一個家庭
      household = await prisma.household.findFirst({
        where: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    }

    if (!household) {
      return NextResponse.json([]) // 沒有家庭則返回空列表
    }

    // 獲取用戶的所有通知
    const notifications = await prisma.notification.findMany({
      where: {
        userId: (session?.user as any)?.id // 用戶 ID
      },
      include: {
        item: {
          select: {
            name: true // 包含相關物品名稱
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // 按創建時間降序排序（最新的在前）
      }
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}


