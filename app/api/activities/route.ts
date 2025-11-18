// 活動 API 路由
// 獲取倉庫操作活動列表（物品創建、移動、更新等），支援時間篩選和多語言翻譯

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTranslations } from '@/lib/translations'
import { translateItemContent } from '@/lib/item-translations'
import { cache, CacheKeys } from '@/lib/cache'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// GET 處理器：獲取活動列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    
    // 獲取查詢參數
    const { searchParams } = new URL(request.url)
    const timeFilter = searchParams.get('timeFilter') || 'all' // 時間篩選器（today/week/all）
    const activeHouseholdId = searchParams.get('householdId') // 家庭 ID
    const bypassCache = searchParams.get('bypassCache') === 'true' // 是否繞過快取
    
    // 根據篩選器計算日期範圍
    let dateFilter = {}
    const now = new Date()
    
    if (timeFilter === 'today') {
      // 今天的開始時間
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      dateFilter = {
        createdAt: {
          gte: startOfDay // 大於等於今天開始
        }
      }
    } else if (timeFilter === 'week') {
      // 一週前的時間
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFilter = {
        createdAt: {
          gte: oneWeekAgo // 大於等於一週前
        }
      }
    }
    
    // 獲取用戶的語言偏好
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true }
    })
    
    const userLanguage = user?.language || 'en' // 用戶語言（預設英文）
    console.log('Activities API - User ID:', userId)
    console.log('Activities API - User language from DB:', user?.language)
    console.log('Activities API - Final language used:', userLanguage)
    const t = getTranslations(userLanguage) // 獲取翻譯函數

    // 獲取用戶的家庭（用於快取鍵）
    let household
    if (activeHouseholdId) {
      // 使用指定的家庭 ID
      household = await prisma.household.findFirst({
        where: {
          id: activeHouseholdId,
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    } else {
      // 備援：使用第一個家庭
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
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    // 先檢查快取（在快取鍵中包含時間篩選器）
    const cacheKey = `${CacheKeys.activities(household.id, userId)}_${timeFilter}`
    const cachedData = !bypassCache ? cache.get(cacheKey) : null
    
    if (cachedData) {
      console.log('Activities API: Returning cached data for household:', household.id, 'filter:', timeFilter)
      return NextResponse.json(cachedData) // 返回快取資料
    }

    // 使用集中式翻譯函數
    const translateItemName = (itemName: string, targetLanguage: string): string => {
      return translateItemContent(itemName, targetLanguage)
    }

    // 獲取物品歷史記錄（簡化查詢以提升效能）
    console.log('📊 Activities: Starting database query for household:', household.id)
    const startTime = Date.now()
    
    const activities = await prisma.itemHistory.findMany({
      where: {
        item: {
          householdId: household.id // 家庭 ID
        },
        ...dateFilter // 日期篩選
      },
      select: {
        id: true, // 活動 ID
        action: true, // 操作類型
        description: true, // 操作描述
        createdAt: true, // 創建時間
        performer: {
          select: {
            name: true // 執行者名稱
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // 按創建時間降序排序
      },
      take: 20 // 限制結果數量以提升效能
    })
    
    const queryTime = Date.now() - startTime
    console.log('📊 Activities: Database query completed in', queryTime, 'ms')

    // 根據用戶語言翻譯活動描述
    const translatedActivities = activities.map(activity => {
      let translatedDescription = activity.description || ''
      
      // 翻譯常見的活動描述
      switch (activity.action) {
        case 'created': // 創建
          if (activity.description && activity.description.includes('created with quantity')) {
            const match = activity.description.match(/Item "([^"]+)" created with quantity (\d+)/)
            if (match) {
              const [, itemName, quantity] = match
              const translatedItemName = translateItemName(itemName, userLanguage)
              translatedDescription = t.itemCreatedWithQuantity.replace('{itemName}', translatedItemName).replace('{quantity}', quantity)
            }
          } else if (activity.description && activity.description.includes('created')) {
            translatedDescription = t.itemCreated
          }
          break
        case 'quantity_updated': // 數量更新
          if (activity.description && activity.description.includes('Quantity increased from')) {
            const match = activity.description.match(/Quantity increased from (\d+) to (\d+)/)
            if (match) {
              const [, from, to] = match
              translatedDescription = t.quantityIncreasedFromTo.replace('{from}', from).replace('{to}', to)
            }
          } else if (activity.description && activity.description.includes('Quantity decreased from')) {
            const match = activity.description.match(/Quantity decreased from (\d+) to (\d+)/)
            if (match) {
              const [, from, to] = match
              translatedDescription = t.quantityDecreasedFromTo.replace('{from}', from).replace('{to}', to)
            }
          }
          break
        case 'moved': // 移動
          if (activity.description && activity.description.includes('moved from')) {
            const match = activity.description.match(/(.+?) moved from (.+?) to (.+)/)
            if (match) {
              const [, itemName, from, to] = match
              const translatedItemName = translateItemName(itemName, userLanguage)
              translatedDescription = t.itemMovedFromTo.replace('{itemName}', translatedItemName).replace('{from}', from).replace('{to}', to)
            }
          }
          break
        case 'updated': // 更新
          translatedDescription = t.itemUpdated
          break
        case 'deleted': // 刪除
          translatedDescription = t.itemDeleted
          break
        default:
          // 對於僅是物品描述的活動，嘗試翻譯它們
          if (activity.description && activity.description.length > 10) {
            translatedDescription = translateItemName(activity.description, userLanguage)
          }
          break
      }
      
      return {
        ...activity,
        description: translatedDescription // 翻譯後的描述
      }
    })

    // 快取結果 2 分鐘（活動變更較頻繁）
    cache.set(cacheKey, translatedActivities, 2 * 60 * 1000)
    console.log('Activities API: Cached data for household:', household.id, 'filter:', timeFilter)

    return NextResponse.json(translatedActivities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
