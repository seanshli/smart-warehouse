// 活動追蹤工具
// 記錄用戶在倉庫系統中的各種操作，用於分析和審計

import { prisma } from './prisma'

// 活動類型定義
export type ActivityType = 
  | 'search' // 搜尋
  | 'view_item' // 查看物品
  | 'view_location' // 查看位置
  | 'view_category' // 查看分類
  | 'navigate' // 導航
  | 'filter' // 篩選
  | 'voice_comment' // 語音備註

// 活動操作定義
export type ActivityAction =
  | 'search_items' // 搜尋物品
  | 'search_with_ai' // 使用 AI 搜尋
  | 'view_item_detail' // 查看物品詳情
  | 'view_item_history' // 查看物品歷史
  | 'view_room' // 查看房間
  | 'view_cabinet' // 查看櫃子
  | 'view_category' // 查看分類
  | 'filter_by_category' // 按分類篩選
  | 'filter_by_room' // 按房間篩選
  | 'filter_by_location' // 按位置篩選
  | 'navigate_to_items' // 導航到物品頁面
  | 'navigate_to_rooms' // 導航到房間頁面
  | 'navigate_to_categories' // 導航到分類頁面
  | 'navigate_to_activities' // 導航到活動頁面
  | 'add_voice_comment' // 添加語音備註

// 追蹤活動參數介面
interface TrackActivityParams {
  userId: string // 用戶 ID
  householdId: string // 家庭 ID
  activityType: ActivityType // 活動類型
  action: ActivityAction // 活動操作
  description?: string // 活動描述（可選）
  metadata?: Record<string, any> // 額外元資料（可選）
  itemId?: string // 物品 ID（可選）
  roomId?: string // 房間 ID（可選）
  cabinetId?: string // 櫃子 ID（可選）
  categoryId?: string // 分類 ID（可選）
}

/**
 * 追蹤用戶活動（用於分析）
 * 此函數記錄用戶操作（如搜尋、查看、導航等）
 * 以幫助管理員了解應用程式的使用情況
 */
export async function trackActivity(params: TrackActivityParams): Promise<void> {
  try {
    await (prisma as any).userActivity.create({
      data: {
        userId: params.userId, // 用戶 ID
        householdId: params.householdId, // 家庭 ID
        activityType: params.activityType, // 活動類型
        action: params.action, // 活動操作
        description: params.description, // 活動描述
        metadata: params.metadata || {}, // 元資料
        itemId: params.itemId, // 物品 ID
        roomId: params.roomId, // 房間 ID
        cabinetId: params.cabinetId, // 櫃子 ID
        categoryId: params.categoryId, // 分類 ID
      }
    })
  } catch (error) {
    // 不拋出錯誤 - 活動追蹤不應中斷應用程式
    console.error('Failed to track activity:', error)
  }
}

/**
 * 輔助函數：為活動創建自然語言描述
 */
export function createActivityDescription(
  activityType: ActivityType,
  action: ActivityAction,
  metadata?: Record<string, any>
): string {
  switch (action) {
    case 'search_items': // 搜尋物品
      return `Searched for "${metadata?.query || 'items'}"`
    case 'search_with_ai': // 使用 AI 搜尋
      return `Used AI search for "${metadata?.query || 'items'}"`
    case 'view_item_detail': // 查看物品詳情
      return `Viewed item: ${metadata?.itemName || 'item'}`
    case 'view_item_history': // 查看物品歷史
      return `Viewed history for: ${metadata?.itemName || 'item'}`
    case 'view_room': // 查看房間
      return `Viewed room: ${metadata?.roomName || 'room'}`
    case 'view_cabinet': // 查看櫃子
      return `Viewed cabinet: ${metadata?.cabinetName || 'cabinet'} in ${metadata?.roomName || 'room'}`
    case 'view_category': // 查看分類
      return `Viewed category: ${metadata?.categoryName || 'category'}`
    case 'filter_by_category': // 按分類篩選
      return `Filtered items by category: ${metadata?.categoryName || 'category'}`
    case 'filter_by_room': // 按房間篩選
      return `Filtered items by room: ${metadata?.roomName || 'room'}`
    case 'filter_by_location': // 按位置篩選
      return `Filtered items by location: ${metadata?.location || 'location'}`
    case 'navigate_to_items': // 導航到物品頁面
      return 'Navigated to items page'
    case 'navigate_to_rooms': // 導航到房間頁面
      return 'Navigated to rooms page'
    case 'navigate_to_categories':
      return 'Navigated to categories page'
    case 'navigate_to_activities':
      return 'Navigated to activities page'
    case 'add_voice_comment':
      return `Added voice comment to: ${metadata?.itemName || 'item'}`
    default:
      return `Performed action: ${action}`
  }
}

