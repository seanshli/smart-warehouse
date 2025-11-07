import { prisma } from './prisma'

export type ActivityType = 
  | 'search' 
  | 'view_item' 
  | 'view_location' 
  | 'view_category' 
  | 'navigate' 
  | 'filter'
  | 'voice_comment'

export type ActivityAction =
  | 'search_items'
  | 'search_with_ai'
  | 'view_item_detail'
  | 'view_item_history'
  | 'view_room'
  | 'view_cabinet'
  | 'view_category'
  | 'filter_by_category'
  | 'filter_by_room'
  | 'filter_by_location'
  | 'navigate_to_items'
  | 'navigate_to_rooms'
  | 'navigate_to_categories'
  | 'navigate_to_activities'
  | 'add_voice_comment'

interface TrackActivityParams {
  userId: string
  householdId: string
  activityType: ActivityType
  action: ActivityAction
  description?: string
  metadata?: Record<string, any>
  itemId?: string
  roomId?: string
  cabinetId?: string
  categoryId?: string
}

/**
 * Track user activity for analytics
 * This function logs user actions like searches, views, and navigation
 * to help admins understand how the app is being used.
 */
export async function trackActivity(params: TrackActivityParams): Promise<void> {
  try {
    await (prisma as any).userActivity.create({
      data: {
        userId: params.userId,
        householdId: params.householdId,
        activityType: params.activityType,
        action: params.action,
        description: params.description,
        metadata: params.metadata || {},
        itemId: params.itemId,
        roomId: params.roomId,
        cabinetId: params.cabinetId,
        categoryId: params.categoryId,
      }
    })
  } catch (error) {
    // Don't throw errors - activity tracking should not break the app
    console.error('Failed to track activity:', error)
  }
}

/**
 * Helper to create natural language descriptions for activities
 */
export function createActivityDescription(
  activityType: ActivityType,
  action: ActivityAction,
  metadata?: Record<string, any>
): string {
  switch (action) {
    case 'search_items':
      return `Searched for "${metadata?.query || 'items'}"`
    case 'search_with_ai':
      return `Used AI search for "${metadata?.query || 'items'}"`
    case 'view_item_detail':
      return `Viewed item: ${metadata?.itemName || 'item'}`
    case 'view_item_history':
      return `Viewed history for: ${metadata?.itemName || 'item'}`
    case 'view_room':
      return `Viewed room: ${metadata?.roomName || 'room'}`
    case 'view_cabinet':
      return `Viewed cabinet: ${metadata?.cabinetName || 'cabinet'} in ${metadata?.roomName || 'room'}`
    case 'view_category':
      return `Viewed category: ${metadata?.categoryName || 'category'}`
    case 'filter_by_category':
      return `Filtered items by category: ${metadata?.categoryName || 'category'}`
    case 'filter_by_room':
      return `Filtered items by room: ${metadata?.roomName || 'room'}`
    case 'filter_by_location':
      return `Filtered items by location: ${metadata?.location || 'location'}`
    case 'navigate_to_items':
      return 'Navigated to items page'
    case 'navigate_to_rooms':
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

