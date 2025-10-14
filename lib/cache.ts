// In-memory cache system for API responses
// This provides fast access to frequently requested data

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clear cache entries that match a pattern (useful for cache invalidation)
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now()
    let expired = 0
    let active = 0

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      } else {
        active++
      }
    }

    return {
      total: this.cache.size,
      active,
      expired
    }
  }
}

// Create a singleton instance
export const cache = new MemoryCache()

// Cache key generators
export const CacheKeys = {
  groupedItems: (householdId: string) => `grouped-items:${householdId}`,
  activities: (householdId: string, userId: string) => `activities:${householdId}:${userId}`,
  dashboardStats: (householdId: string) => `dashboard-stats:${householdId}`,
  categories: (householdId: string) => `categories:${householdId}`,
  rooms: (householdId: string) => `rooms:${householdId}`,
  cabinets: (householdId: string, roomId: string) => `cabinets:${householdId}:${roomId}`,
}

// Cache invalidation helpers
export const CacheInvalidation = {
  // Clear all item-related cache when items change
  clearItemCache: (householdId: string) => {
    cache.clearPattern(`grouped-items:${householdId}`)
    cache.clearPattern(`activities:${householdId}`)
    cache.clearPattern(`dashboard-stats:${householdId}`)
  },
  
  // Clear room-related cache when rooms change
  clearRoomCache: (householdId: string) => {
    cache.clearPattern(`rooms:${householdId}`)
    cache.clearPattern(`cabinets:${householdId}`)
    cache.clearPattern(`grouped-items:${householdId}`)
    cache.clearPattern(`dashboard-stats:${householdId}`)
  },
  
  // Clear category-related cache when categories change
  clearCategoryCache: (householdId: string) => {
    cache.clearPattern(`categories:${householdId}`)
    cache.clearPattern(`grouped-items:${householdId}`)
  }
}

// Utility function to wrap API functions with caching
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl?: number
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args)
    
    // Try to get from cache first
    const cached = cache.get<R>(key)
    if (cached) {
      console.log(`Cache HIT for key: ${key}`)
      return cached
    }
    
    console.log(`Cache MISS for key: ${key}`)
    
    // Execute the function and cache the result
    const result = await fn(...args)
    cache.set(key, result, ttl)
    
    return result
  }
}
