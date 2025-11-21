// 物品 API 路由（單個物品操作）
// 處理單個物品的獲取、更新、部分更新、刪除等操作

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAndCreateNotifications } from '@/lib/notifications'
import { trackActivity } from '@/lib/activity-tracker'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// GET 處理器：獲取單個物品詳情
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

    // 查詢物品（包含分類、房間、櫃子資訊）
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
      },
      include: {
        category: {
          include: {
            parent: true // 包含父分類
          }
        },
        room: true, // 包含房間資訊
        cabinet: true // 包含櫃子資訊
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // 追蹤物品詳情查看活動（非阻塞）
    trackActivity({
      userId,
      householdId: item.householdId,
      activityType: 'view_item',
      action: 'view_item_detail',
      description: `Viewed item details: ${item.name}`,
      metadata: {
        itemName: item.name,
        category: item.category?.name,
        room: item.room?.name,
        cabinet: item.cabinet?.name,
        quantity: item.quantity
      },
      itemId: item.id,
      roomId: item.roomId || undefined,
      cabinetId: item.cabinetId || undefined,
      categoryId: item.categoryId || undefined
    }).catch(err => console.error('Failed to track item detail view activity:', err))

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
}

// PUT 處理器：完整更新物品
export async function PUT(
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
    const body = await request.json()

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

    // 更新物品（完整更新所有欄位）
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        name: body.name, // 物品名稱
        description: body.description, // 物品描述
        quantity: body.quantity, // 數量
        minQuantity: body.minQuantity, // 最小數量
        categoryId: body.categoryId, // 分類 ID
        roomId: body.roomId, // 房間 ID
        cabinetId: body.cabinetId, // 櫃子 ID
        imageUrl: body.imageUrl, // 圖片 URL
        updatedAt: new Date() // 更新時間
      },
      include: {
        category: {
          include: {
            parent: true // 包含父分類
          }
        },
        room: true, // 包含房間資訊
        cabinet: true // 包含櫃子資訊
      }
    })

    // 創建活動記錄
    await prisma.itemHistory.create({
      data: {
        itemId: itemId,
        action: 'updated', // 操作類型：更新
        description: `Item "${updatedItem.name}" was updated`,
        performedBy: userId // 執行者
      }
    })

    // 為物品更新創建通知
    try {
      await checkAndCreateNotifications(updatedItem, userId, 'updated', item)
    } catch (error) {
      console.error('Failed to create notifications for item update:', error)
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

// PATCH 處理器：部分更新物品（僅更新提供的欄位，如僅更新數量）
export async function PATCH(
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
    const body = await request.json()

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

    // 對於 PATCH，僅更新提供的欄位（例如僅更新數量）
    const updateData: any = {
      updatedAt: new Date() // 更新時間
    }

    if (body.quantity !== undefined) {
      if (body.quantity < 0) {
        return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 })
      }
      updateData.quantity = body.quantity // 更新數量
    }

    if (body.minQuantity !== undefined) {
      updateData.minQuantity = body.minQuantity // 更新最小數量
    }

    // 更新物品
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
      include: {
        category: {
          include: {
            parent: true // 包含父分類
          }
        },
        room: true, // 包含房間資訊
        cabinet: true // 包含櫃子資訊
      }
    })

    // 如果數量有變更，創建數量變更活動記錄
    if (body.quantity !== undefined && body.quantity !== item.quantity) {
      await prisma.itemHistory.create({
        data: {
          itemId: itemId,
          action: body.quantity > item.quantity ? 'quantity_increased' : 'quantity_decreased', // 操作類型：數量增加或減少
          description: `Quantity ${body.quantity > item.quantity ? 'increased' : 'decreased'} from ${item.quantity} to ${body.quantity}`,
          performedBy: userId // 執行者
        }
      })

      // 為數量變更創建通知
      try {
        await checkAndCreateNotifications(updatedItem, userId, 'updated', item)
      } catch (error) {
        console.error('Failed to create notifications for quantity update:', error)
      }
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating item quantity:', error)
    return NextResponse.json({ error: 'Failed to update item quantity' }, { status: 500 })
  }
}

// DELETE 處理器：刪除物品
export async function DELETE(
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

    // 刪除物品前創建活動記錄（可選，根據需求實現）

    // 刪除物品
    await prisma.item.delete({
      where: { id: itemId }
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}