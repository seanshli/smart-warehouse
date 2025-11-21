// Tuya Home Manager
// 管理 Tuya Home 與 Household 的對應關係
// Manage Tuya Home mapping to Household

import { prisma } from './prisma'

/**
 * 創建 Tuya Home（通過 Tuya Cloud API）
 * 注意：實際創建需要在客戶端（iOS/Android）使用 SDK 進行
 * 這個函數主要用於記錄和驗證
 */
export async function createTuyaHome(householdId: string, homeName: string): Promise<string | null> {
  try {
    // 注意：實際的 Tuya Home 創建需要在客戶端使用 SDK
    // 這裡只是記錄對應關係
    // 客戶端創建 Home 後，會調用 POST /api/mqtt/tuya/home 來更新對應關係
    
    const household = await prisma.household.findUnique({
      where: { id: householdId },
    })

    if (!household) {
      throw new Error('Household not found')
    }

    // 如果已經有 Tuya Home ID，直接返回
    if (household.tuyaHomeId) {
      return household.tuyaHomeId
    }

    // 返回 null，表示需要在客戶端創建
    return null
  } catch (error) {
    console.error('Error in createTuyaHome:', error)
    return null
  }
}

/**
 * 獲取 Household 對應的 Tuya Home ID
 */
export async function getTuyaHome(householdId: string): Promise<string | null> {
  try {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: { tuyaHomeId: true },
    })

    return household?.tuyaHomeId || null
  } catch (error) {
    console.error('Error getting Tuya Home:', error)
    return null
  }
}

/**
 * 更新 Household 的 Tuya Home ID
 */
export async function updateTuyaHomeMapping(householdId: string, tuyaHomeId: string): Promise<boolean> {
  try {
    await prisma.household.update({
      where: { id: householdId },
      data: { tuyaHomeId: tuyaHomeId },
    })

    return true
  } catch (error) {
    console.error('Error updating Tuya Home mapping:', error)
    return false
  }
}

