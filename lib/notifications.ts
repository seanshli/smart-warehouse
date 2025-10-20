// Notification system for Smart Warehouse

export interface NotificationData {
  type: 'LOW_INVENTORY' | 'ITEM_ADDED' | 'ITEM_UPDATED' | 'ITEM_DELETED' | 'QUANTITY_CHANGED' | 'LOCATION_CHANGED' | 'SYSTEM_ALERT'
  title: string
  message: string
  userId: string
  itemId?: string
  householdId?: string
  metadata?: Record<string, any>
}

export async function createNotification(data: NotificationData) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        itemId: data.itemId
      }
    })
    
    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw error
  }
}

export async function createLowInventoryNotification(item: any, userId: string) {
  return createNotification({
    type: 'LOW_INVENTORY',
    title: 'Low Inventory Alert',
    message: `${item.name} is running low (${item.quantity} remaining)`,
    userId,
    itemId: item.id
  })
}

export async function createItemAddedNotification(item: any, userId: string) {
  return createNotification({
    type: 'ITEM_ADDED',
    title: 'New Item Added',
    message: `${item.name} has been added to your inventory`,
    userId,
    itemId: item.id
  })
}

export async function createItemUpdatedNotification(item: any, userId: string, changes: string[]) {
  return createNotification({
    type: 'ITEM_UPDATED',
    title: 'Item Updated',
    message: `${item.name} has been updated: ${changes.join(', ')}`,
    userId,
    itemId: item.id
  })
}

export async function createQuantityChangedNotification(item: any, userId: string, oldQuantity: number, newQuantity: number) {
  const change = newQuantity > oldQuantity ? 'increased' : 'decreased'
  return createNotification({
    type: 'QUANTITY_CHANGED',
    title: 'Quantity Changed',
    message: `${item.name} quantity ${change} from ${oldQuantity} to ${newQuantity}`,
    userId,
    itemId: item.id
  })
}

export async function createLocationChangedNotification(item: any, userId: string, oldLocation: string, newLocation: string) {
  return createNotification({
    type: 'LOCATION_CHANGED',
    title: 'Location Changed',
    message: `${item.name} moved from ${oldLocation} to ${newLocation}`,
    userId,
    itemId: item.id
  })
}

export async function createSystemAlertNotification(title: string, message: string, userId: string, householdId?: string) {
  return createNotification({
    type: 'SYSTEM_ALERT',
    title,
    message,
    userId,
    householdId
  })
}

// Auto-create notifications for common scenarios
export async function checkAndCreateNotifications(item: any, userId: string, action: 'created' | 'updated' | 'deleted', oldData?: any) {
  const notifications = []
  
  // Low inventory check
  if (item.quantity <= item.minQuantity) {
    notifications.push(await createLowInventoryNotification(item, userId))
  }
  
  // Item added notification
  if (action === 'created') {
    notifications.push(await createItemAddedNotification(item, userId))
  }
  
  // Item updated notification
  if (action === 'updated' && oldData) {
    const changes = []
    
    if (oldData.quantity !== item.quantity) {
      changes.push(`quantity changed from ${oldData.quantity} to ${item.quantity}`)
    }
    
    if (oldData.name !== item.name) {
      changes.push(`name changed from "${oldData.name}" to "${item.name}"`)
    }
    
    if (oldData.roomId !== item.roomId) {
      changes.push('location changed')
    }
    
    if (changes.length > 0) {
      notifications.push(await createItemUpdatedNotification(item, userId, changes))
    }
  }
  
  return notifications
}
