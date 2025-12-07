// 查找接待處（reception）家庭的輔助函數
// Helper functions to find reception/front desk household

import { prisma } from '@/lib/prisma'

/**
 * 查找建築物中的接待處家庭
 * Find reception/front desk household in a building
 * 
 * 通過名稱匹配查找：reception, frontdesk, front desk, 前台, 接待處
 * Searches by name matching: reception, frontdesk, front desk, 前台, 接待處
 */
export async function findReceptionHousehold(buildingId: string): Promise<string | null> {
  try {
    // 查找名稱包含接待處相關關鍵詞的家庭
    // Search for households with reception-related keywords in name
    const receptionKeywords = [
      'reception',
      'frontdesk',
      'front desk',
      'front-desk',
      '前台',
      '接待處',
      'receptionist',
      'front office',
    ]

    const households = await prisma.household.findMany({
      where: {
        buildingId,
        OR: receptionKeywords.map(keyword => ({
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        })),
      },
      select: {
        id: true,
        name: true,
      },
      take: 1,
    })

    if (households.length > 0) {
      console.log(`[Reception Household] Found reception household: ${households[0].name} (${households[0].id})`)
      return households[0].id
    }

    // 如果找不到，嘗試查找第一個名稱包含 "reception" 或 "front" 的家庭
    // If not found, try to find first household with "reception" or "front" in name
    const fallbackHousehold = await prisma.household.findFirst({
      where: {
        buildingId,
        OR: [
          { name: { contains: 'reception', mode: 'insensitive' } },
          { name: { contains: 'front', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (fallbackHousehold) {
      console.log(`[Reception Household] Found fallback reception household: ${fallbackHousehold.name} (${fallbackHousehold.id})`)
      return fallbackHousehold.id
    }

    console.warn(`[Reception Household] No reception household found for building ${buildingId}`)
    return null
  } catch (error) {
    console.error('[Reception Household] Error finding reception household:', error)
    return null
  }
}

/**
 * 創建接待處公告（僅發送到接待處家庭，不廣播）
 * Create reception announcement (only sent to reception household, not broadcast)
 */
export async function createReceptionAnnouncement(
  buildingId: string,
  title: string,
  message: string,
  createdBy: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  try {
    const receptionHouseholdId = await findReceptionHousehold(buildingId)
    
    if (!receptionHouseholdId) {
      console.warn(`[Reception Announcement] Cannot create announcement: reception household not found for building ${buildingId}`)
      return null
    }

    const announcement = await prisma.announcement.create({
      data: {
        source: 'BUILDING',
        sourceId: buildingId,
        title,
        message,
        targetType: 'SPECIFIC_HOUSEHOLD',
        targetId: receptionHouseholdId,
        createdBy,
        isActive: true,
        // Store metadata in message if needed, or extend schema to add metadata field
      },
    })

    console.log(`[Reception Announcement] Created announcement ${announcement.id} for reception household ${receptionHouseholdId}`)
    return announcement.id
  } catch (error) {
    console.error('[Reception Announcement] Error creating reception announcement:', error)
    return null
  }
}

/**
 * 記錄日誌（記錄到 UserActivity）
 * Log activity (record to UserActivity)
 */
export async function logReceptionActivity(
  userId: string,
  householdId: string,
  activityType: string,
  action: string,
  description: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await prisma.userActivity.create({
      data: {
        userId,
        householdId,
        activityType,
        action,
        description,
        metadata: metadata || {},
      },
    })
    console.log(`[Reception Log] Logged activity: ${action} - ${description}`)
  } catch (error) {
    console.error('[Reception Log] Error logging activity:', error)
    // Don't throw - logging failures shouldn't break the main flow
  }
}

