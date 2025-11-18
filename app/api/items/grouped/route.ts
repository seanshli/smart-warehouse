// 分組物品 API 路由
// 將相同名稱、分類和位置的物品合併為一組，用於顯示和統計

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// GET 處理器：獲取分組物品列表
export async function GET(request: NextRequest) {
  let prisma = createPrismaClient() // 為此請求創建新的客戶端
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') // 搜尋關鍵字（條碼/QR 碼）
    const category = searchParams.get('category') // 分類 ID
    const room = searchParams.get('room') // 房間 ID

    // 獲取用戶的家庭
    const household = await prisma.household.findFirst({
      where: {
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

    // 構建篩選條件
    const whereClause: any = {
      householdId: household.id
    }

    if (search) {
      whereClause.OR = [
        { barcode: { contains: search } }, // 條碼包含搜尋關鍵字
        { qrCode: { contains: search } } // QR 碼包含搜尋關鍵字
      ]
    }

    if (category) {
      whereClause.categoryId = category // 分類篩選
    }

    if (room) {
      whereClause.roomId = room // 房間篩選
    }

    // 獲取所有物品及其關聯資訊
    const items = await prisma.item.findMany({
      where: whereClause,
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

    // 按名稱、分類和位置分組物品
    const groupedItems = new Map<string, any>()

    items.forEach(item => {
      // 創建唯一的分組鍵（名稱、分類、房間、櫃子）
      const groupKey = `${item.name.toLowerCase()}_${item.categoryId || 'no-category'}_${item.roomId || 'no-room'}_${item.cabinetId || 'no-cabinet'}`
      
      if (groupedItems.has(groupKey)) {
        // 如果已存在此分組，合併數量
        const existingItem = groupedItems.get(groupKey)
        existingItem.quantity += item.quantity // 累加數量
        existingItem.itemIds.push(item.id) // 添加物品 ID 到列表
        
        // 更新最小數量為所有分組物品中的最小值
        if (item.minQuantity !== null) {
          existingItem.minQuantity = existingItem.minQuantity !== null 
            ? Math.min(existingItem.minQuantity, item.minQuantity)
            : item.minQuantity
        }
        
        // 如果有圖片 URL 且現有項目沒有，則保留最新的圖片 URL
        if (item.imageUrl && !existingItem.imageUrl) {
          existingItem.imageUrl = item.imageUrl
        }
        
        // Merge descriptions (keep unique descriptions)
        if (item.description && !existingItem.description) {
          existingItem.description = item.description
        }
      } else {
        groupedItems.set(groupKey, {
          ...item,
          itemIds: [item.id] // Track all item IDs for this group
        })
      }
    })

    // Convert map to array
    const result = Array.from(groupedItems.values())

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching grouped items:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to fetch grouped items',
        details: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect() // Ensure client is disconnected
  }
}
