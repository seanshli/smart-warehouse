// 通知系統 - Smart Warehouse
// 處理各種倉庫操作的通知，包括低庫存警告、物品變更通知等

export interface NotificationData {
  type: 'LOW_INVENTORY' | 'ITEM_ADDED' | 'ITEM_UPDATED' | 'ITEM_DELETED' | 'QUANTITY_CHANGED' | 'LOCATION_CHANGED' | 'SYSTEM_ALERT' | 'MAIL_RECEIVED' | 'DOOR_BELL_RUNG' | 'PACKAGE_RECEIVED' | 'FACILITY_RESERVATION_APPROVED' | 'FACILITY_RESERVATION_REJECTED' // 通知類型
  title: string // 通知標題
  message: string // 通知訊息
  userId: string // 用戶 ID
  itemId?: string // 物品 ID（可選）
  householdId?: string // 家庭 ID（可選）
  metadata?: Record<string, any> // 額外元資料（可選，可包含 mailboxId, doorBellId, packageId, facilityReservationId）
}

// 創建通知
export async function createNotification(data: NotificationData) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    console.log('[createNotification] Creating notification:', {
      type: data.type,
      userId: data.userId,
      householdId: data.householdId,
      packageId: data.metadata?.packageId,
    })
    
    const notification = await prisma.notification.create({
      data: {
        type: data.type, // 通知類型
        title: data.title, // 標題
        message: data.message, // 訊息
        userId: data.userId, // 用戶 ID
        itemId: data.itemId, // 物品 ID（可選）
        householdId: data.householdId, // 家庭 ID（可選）
        mailboxId: data.metadata?.mailboxId, // 郵箱 ID（可選）
        doorBellId: data.metadata?.doorBellId, // 門鈴 ID（可選）
        packageId: data.metadata?.packageId, // 包裹 ID（可選）
        facilityReservationId: data.metadata?.facilityReservationId, // 設施預訂 ID（可選）
      }
    })
    
    console.log('[createNotification] Notification created successfully:', notification.id)
    return notification
  } catch (error) {
    console.error('[createNotification] Failed to create notification:', error)
    console.error('[createNotification] Error details:', {
      type: data.type,
      userId: data.userId,
      householdId: data.householdId,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

// 創建低庫存通知
export async function createLowInventoryNotification(item: any, userId: string) {
  return createNotification({
    type: 'LOW_INVENTORY', // 通知類型：低庫存
    title: 'Low Inventory Alert', // 標題：低庫存警告
    message: `${item.name} is running low (${item.quantity} remaining)`, // 訊息：物品名稱 + 剩餘數量
    userId,
    itemId: item.id
  })
}

// 創建物品添加通知
export async function createItemAddedNotification(item: any, userId: string) {
  return createNotification({
    type: 'ITEM_ADDED', // 通知類型：物品已添加
    title: 'New Item Added', // 標題：新物品已添加
    message: `${item.name} has been added to your inventory`, // 訊息：物品已添加到庫存
    userId,
    itemId: item.id
  })
}

// 創建物品更新通知
export async function createItemUpdatedNotification(item: any, userId: string, changes: string[]) {
  return createNotification({
    type: 'ITEM_UPDATED', // 通知類型：物品已更新
    title: 'Item Updated', // 標題：物品已更新
    message: `${item.name} has been updated: ${changes.join(', ')}`, // 訊息：物品名稱 + 變更列表
    userId,
    itemId: item.id
  })
}

// 創建數量變更通知
export async function createQuantityChangedNotification(item: any, userId: string, oldQuantity: number, newQuantity: number) {
  const change = newQuantity > oldQuantity ? 'increased' : 'decreased' // 判斷是增加還是減少
  return createNotification({
    type: 'QUANTITY_CHANGED', // 通知類型：數量已變更
    title: 'Quantity Changed', // 標題：數量已變更
    message: `${item.name} quantity ${change} from ${oldQuantity} to ${newQuantity}`, // 訊息：物品名稱 + 數量變更
    userId,
    itemId: item.id
  })
}

// 創建位置變更通知
export async function createLocationChangedNotification(item: any, userId: string, oldLocation: string, newLocation: string) {
  return createNotification({
    type: 'LOCATION_CHANGED', // 通知類型：位置已變更
    title: 'Location Changed', // 標題：位置已變更
    message: `${item.name} moved from ${oldLocation} to ${newLocation}`, // 訊息：物品名稱 + 位置變更
    userId,
    itemId: item.id
  })
}

// 創建系統警告通知
export async function createSystemAlertNotification(title: string, message: string, userId: string, householdId?: string) {
  return createNotification({
    type: 'SYSTEM_ALERT', // 通知類型：系統警告
    title, // 標題
    message, // 訊息
    userId,
    householdId // 家庭 ID（可選）
  })
}

// 自動為常見場景創建通知
export async function checkAndCreateNotifications(item: any, userId: string, action: 'created' | 'updated' | 'deleted', oldData?: any) {
  const notifications = []
  
  // 低庫存檢查
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
