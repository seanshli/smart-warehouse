'use client'

import { useSession } from 'next-auth/react'
import { useHousehold } from '@/components/HouseholdProvider'

/**
 * Client-side activity tracking helper
 * Use this in React components to track user activities
 */
export function useActivityTracker() {
  const { data: session } = useSession()
  const { household } = useHousehold()

  const trackActivity = async (
    activityType: 'search' | 'view_item' | 'view_location' | 'view_category' | 'navigate' | 'filter' | 'voice_comment',
    action: string,
    metadata?: Record<string, any>,
    description?: string,
    itemId?: string,
    roomId?: string,
    cabinetId?: string,
    categoryId?: string
  ) => {
    // Don't track if not authenticated or no household
    if (!session?.user || !household?.id) {
      return
    }

    try {
      await fetch('/api/activities/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          householdId: household.id,
          activityType,
          action,
          metadata,
          description,
          itemId,
          roomId,
          cabinetId,
          categoryId
        })
      })
    } catch (error) {
      // Silently fail - don't break the app if tracking fails
      console.error('Failed to track activity:', error)
    }
  }

  return { trackActivity }
}

