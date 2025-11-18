// 記憶體快取系統 - 用於 API 回應
// 提供對頻繁請求資料的快速存取，提升應用程式效能

// 快取項目介面定義
interface CacheEntry<T> {
  data: T // 快取資料
  timestamp: number // 時間戳（建立時間）
  ttl: number // 存活時間（毫秒）
}

// 記憶體快取類別
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>() // 快取儲存（鍵值對）
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 預設存活時間：5 分鐘

  // 設定快取項目
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data, // 快取資料
      timestamp: Date.now(), // 當前時間戳
      ttl // 存活時間
    })
  }

  // 獲取快取項目
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null // 快取不存在
    }

    // 檢查項目是否已過期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key) // 刪除過期項目
      return null
    }

    return entry.data // 返回快取資料
  }

  // 刪除快取項目
  delete(key: string): void {
    this.cache.delete(key)
  }

  // 清除所有快取
  clear(): void {
    this.cache.clear()
  }

  // 清除符合模式的快取項目（用於快取失效）
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern) // 正則表達式
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key) // 刪除符合模式的項目
      }
    })
  }

  // 獲取快取統計資訊
  getStats() {
    const now = Date.now()
    let expired = 0 // 過期項目數
    let active = 0 // 有效項目數

    const values = Array.from(this.cache.values())
    values.forEach(entry => {
      if (now - entry.timestamp > entry.ttl) {
        expired++ // 已過期
      } else {
        active++ // 仍有效
      }
    })

    return {
      total: this.cache.size, // 總項目數
      active, // 有效項目數
      expired // 過期項目數
    }
  }
}

// 創建單例實例
export const cache = new MemoryCache()

// 快取鍵生成器（用於統一管理快取鍵）
export const CacheKeys = {
  groupedItems: (householdId: string) => `grouped-items:${householdId}`, // 分組物品
  activities: (householdId: string, userId: string) => `activities:${householdId}:${userId}`, // 活動記錄
  dashboardStats: (householdId: string) => `dashboard-stats:${householdId}`, // 儀表板統計
  categories: (householdId: string) => `categories:${householdId}`, // 分類列表
  rooms: (householdId: string) => `rooms:${householdId}`, // 房間列表
  cabinets: (householdId: string, roomId: string) => `cabinets:${householdId}:${roomId}`, // 櫃子列表
  // 管理員專用快取鍵
  adminStats: () => `admin:stats`, // 管理員統計
  adminHouseholds: () => `admin:households`, // 管理員家庭列表
  adminItems: (query?: string) => `admin:items${query ? `:${query}` : ''}`, // 管理員物品列表
  adminUsers: () => `admin:users`, // 管理員用戶列表
  adminRoles: () => `admin:roles`, // 管理員角色列表
  duplicateDetection: (itemName: string, description?: string) => `duplicate:${itemName}:${description || ''}`, // 重複檢測
}

// 快取失效輔助函數
export const CacheInvalidation = {
  // 當物品變更時清除所有物品相關快取
  clearItemCache: (householdId: string) => {
    cache.clearPattern(`grouped-items:${householdId}`) // 分組物品
    cache.clearPattern(`activities:${householdId}`) // 活動記錄
    cache.clearPattern(`dashboard-stats:${householdId}`) // 儀表板統計
  },
  
  // 當房間變更時清除所有房間相關快取
  clearRoomCache: (householdId: string) => {
    cache.clearPattern(`rooms:${householdId}`) // 房間列表
    cache.clearPattern(`cabinets:${householdId}`) // 櫃子列表
    cache.clearPattern(`grouped-items:${householdId}`) // 分組物品
    cache.clearPattern(`dashboard-stats:${householdId}`) // 儀表板統計
  },
  
  // 當分類變更時清除所有分類相關快取
  clearCategoryCache: (householdId: string) => {
    cache.clearPattern(`categories:${householdId}`) // 分類列表
    cache.clearPattern(`grouped-items:${householdId}`) // 分組物品
  },
  
  // 當管理員資料變更時清除所有管理員相關快取
  clearAdminCache: () => {
    cache.clearPattern(`admin:`) // 管理員相關快取
  },
  
  // 當用戶資料變更時清除所有用戶相關快取
  clearUserCache: (userId: string) => {
    cache.clearPattern(`user:${userId}`) // 用戶快取
    cache.clearPattern(`activities:.*:${userId}`) // 用戶活動記錄
  },
  
  // 當物品變更時清除重複檢測快取
  clearDuplicateCache: () => {
    cache.clearPattern(`duplicate:`) // 重複檢測快取
  }
}

// 實用函數：為 API 函數包裝快取功能
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>, // 要包裝的函數
  keyGenerator: (...args: T) => string, // 快取鍵生成器
  ttl?: number // 存活時間（可選）
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args) // 生成快取鍵
    
    // 先嘗試從快取獲取
    const cached = cache.get<R>(key)
    if (cached) {
      console.log(`Cache HIT for key: ${key}`) // 快取命中
      return cached
    }
    
    console.log(`Cache MISS for key: ${key}`) // 快取未命中
    
    // 執行函數並快取結果
    const result = await fn(...args)
    cache.set(key, result, ttl)
    
    return result
  }
}
