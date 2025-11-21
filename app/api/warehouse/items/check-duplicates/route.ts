// 檢查重複物品 API 路由
// 檢測倉庫中具有相同名稱但存儲在不同位置的物品（重複物品）

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST 處理器：檢查重複物品
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id

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

    // 獲取此家庭的所有物品
    const items = await prisma.item.findMany({
      where: {
        householdId: household.id
      },
      select: {
        id: true, // 物品 ID
        name: true, // 物品名稱
        quantity: true, // 數量
        room: {
          select: {
            name: true // 房間名稱
          }
        },
        cabinet: {
          select: {
            name: true // 櫃子名稱
          }
        }
      }
    })

    // 按標準化名稱分組（不區分大小寫）
    const itemGroups = new Map<string, any[]>()
    
    items.forEach(item => {
      const normalizedName = item.name.trim().toLowerCase() // 標準化名稱（轉小寫、去空格）
      if (!itemGroups.has(normalizedName)) {
        itemGroups.set(normalizedName, [])
      }
      itemGroups.get(normalizedName)!.push(item)
    })

    // 查找重複物品（具有相同名稱但出現在多個位置的物品）
    const duplicates = Array.from(itemGroups.entries())
      .filter(([_name, items]) => items.length > 1) // 過濾出出現多次的物品
      .map(([name, items]) => ({
        name: items[0].name, // 原始大小寫
        normalizedName: name, // 標準化名稱
        count: items.length, // 重複數量
        locations: items.map(item => ({
          id: item.id, // 物品 ID
          quantity: item.quantity, // 數量
          room: item.room?.name || null, // 房間名稱
          cabinet: item.cabinet?.name || null // 櫃子名稱
        }))
      }))

    return NextResponse.json({
      totalItems: items.length, // 總物品數
      duplicateGroups: duplicates.length, // 重複群組數
      duplicates: duplicates // 重複物品列表
    })
  } catch (error) {
    console.error('Error checking item duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    )
  }
}
