// 重複物品 API 路由
// 檢測和合併倉庫中的重複物品（基於名稱匹配）

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// GET 處理器：查找重複物品
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const url = new URL(request.url)
    const householdId = url.searchParams.get('householdId') // 家庭 ID

    if (!householdId) {
      return NextResponse.json({ error: 'Household ID required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // 按名稱和位置查找潛在的重複物品
    const items = await prisma.item.findMany({
      where: {
        householdId: householdId // 家庭 ID
      },
      include: {
        category: {
          include: {
            parent: true // 包含父分類
          }
        },
        room: true, // 包含房間資訊
        cabinet: true // 包含櫃子資訊
      },
      orderBy: {
        name: 'asc' // 按名稱升序排序
      }
    })

    // 按潛在重複物品分組
    const duplicateGroups: { [key: string]: any[] } = {}
    
    items.forEach(item => {
      // 僅基於名稱創建鍵（更靈活的重複檢測）
      const key = `${item.name.toLowerCase().trim()}` // 標準化名稱（轉小寫、去空格）
      
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = []
      }
      duplicateGroups[key].push(item) // 添加到對應群組
    })

    // 過濾出僅包含重複物品的群組（長度 > 1）
    const duplicates = Object.values(duplicateGroups).filter(group => group.length > 1)

    console.log('Duplicate detection results:', {
      totalItems: items.length, // 總物品數
      duplicateGroups: Object.keys(duplicateGroups).length, // 群組數
      duplicatesFound: duplicates.length, // 重複群組數
      groups: Object.entries(duplicateGroups).map(([key, group]) => ({
        key, // 群組鍵
        count: group.length, // 群組內物品數
        items: group.map(item => ({ id: item.id, name: item.name, room: item.room?.name, cabinet: item.cabinet?.name }))
      }))
    })

    return NextResponse.json(duplicates)
  } catch (error) {
    console.error('Error finding duplicates:', error)
    return NextResponse.json({ error: 'Failed to find duplicates' }, { status: 500 })
  }
}

// POST 處理器：合併重複物品
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()
    const { itemIds, targetItemId } = body // 來源物品 ID 列表和目標物品 ID

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'Item IDs required' }, { status: 400 })
    }

    if (!targetItemId) {
      return NextResponse.json({ error: 'Target item ID required' }, { status: 400 })
    }

    // 驗證用戶有權限存取所有物品
    const items = await prisma.item.findMany({
      where: {
        id: {
          in: [...itemIds, targetItemId] // 包含所有物品 ID
        },
        household: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      }
    })

    if (items.length !== itemIds.length + 1) {
      return NextResponse.json({ error: 'Some items not found or access denied' }, { status: 404 })
    }

    const targetItem = items.find(item => item.id === targetItemId) // 目標物品
    const sourceItems = items.filter(item => itemIds.includes(item.id)) // 來源物品列表

    if (!targetItem) {
      return NextResponse.json({ error: 'Target item not found' }, { status: 404 })
    }

    // 計算總數量（來源物品數量 + 目標物品數量）
    const totalQuantity = sourceItems.reduce((sum, item) => sum + item.quantity, 0) + targetItem.quantity

    // 獲取最近更新的物品詳情（用於描述和其他欄位）
    const mostRecentItem = [targetItem, ...sourceItems].sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return dateB - dateA // 按更新時間降序排序
    })[0]

    // 更新目標物品（合併數量和最佳描述）
    const updatedItem = await prisma.item.update({
      where: { id: targetItemId },
      data: {
        quantity: totalQuantity, // 合併後的總數量
        description: mostRecentItem.description || targetItem.description, // 使用最新的描述
        imageUrl: mostRecentItem.imageUrl || targetItem.imageUrl, // 使用最新的圖片 URL
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

    // 為合併操作創建活動記錄
    await prisma.itemHistory.create({
      data: {
        itemId: targetItemId,
        action: 'quantity_updated', // 操作類型：數量已更新
        description: `Item "${updatedItem.name}" quantity updated to ${totalQuantity} (combined ${sourceItems.length + 1} items)`, // 操作描述
        performedBy: userId // 執行者
      }
    })

    // 刪除來源物品
    await prisma.item.deleteMany({
      where: {
        id: {
          in: itemIds // 來源物品 ID 列表
        }
      }
    })

    return NextResponse.json({
      message: 'Items combined successfully', // 成功訊息
      updatedItem, // 更新後的物品
      combinedCount: sourceItems.length // 合併的物品數量
    })
  } catch (error) {
    console.error('Error combining items:', error)
    return NextResponse.json({ error: 'Failed to combine items' }, { status: 500 })
  }
}
