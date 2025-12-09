// import { Client, TextMessage, ImageMessage } from '@line/bot-sdk'
import { prisma } from './prisma'

// TODO: Install @line/bot-sdk package: npm install @line/bot-sdk
// Temporary types until package is installed
type TextMessage = any
type ImageMessage = any

// LINE Client 實例
// let lineClient: Client | null = null

/**
 * 獲取 LINE Client 實例 (commented out until @line/bot-sdk is installed)
 */
// function getLineClient(): Client {
//   if (!lineClient) {
//     const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
//     const channelSecret = process.env.LINE_CHANNEL_SECRET

//     if (!channelAccessToken || !channelSecret) {
//       throw new Error('LINE credentials not configured')
//     }

//     lineClient = new Client({
//       channelAccessToken,
//       channelSecret,
//     })
//   }

//   return lineClient
// }

/**
 * 發送文本消息到 LINE 群組
 */
export async function sendLineGroupMessage(
  groupId: string,
  message: string
): Promise<void> {
  // TODO: Implement after installing @line/bot-sdk
  throw new Error('LINE SDK not installed. Run: npm install @line/bot-sdk')
  
  // try {
  //   const client = getLineClient()
  //   
  //   await client.pushMessage(groupId, {
  //     type: 'text',
  //     text: message,
  //   } as TextMessage)

  //   console.log('LINE message sent to group:', groupId)
  // } catch (error) {
  //   console.error('Error sending LINE message:', error)
  //   throw error
  // }
}

/**
 * 發送圖片消息到 LINE 群組
 */
export async function sendLineGroupImage(
  groupId: string,
  imageUrl: string,
  previewUrl?: string
): Promise<void> {
  // TODO: Implement after installing @line/bot-sdk
  throw new Error('LINE SDK not installed. Run: npm install @line/bot-sdk')
  
  // try {
  //   const client = getLineClient()
  //   
  //   await client.pushMessage(groupId, {
  //     type: 'image',
  //     originalContentUrl: imageUrl,
  //     previewImageUrl: previewUrl || imageUrl,
  //   } as ImageMessage)

  //   console.log('LINE image sent to group:', groupId)
  // } catch (error) {
  //   console.error('Error sending LINE image:', error)
  //   throw error
  // }
}

/**
 * 創建 LINE 群組（需要通過 LINE Official Account Manager 手動創建）
 * 然後將群組 ID 關聯到 household
 */
export async function linkLineGroupToHousehold(
  householdId: string,
  lineGroupId: string,
  groupName: string
): Promise<void> {
  // TODO: Add LineGroup model to Prisma schema first
  throw new Error('LINE integration not yet configured. Add LineGroup model to Prisma schema first.')
  
  // try {
  //   // 檢查 household 是否存在
  //   const household = await prisma.household.findUnique({
  //     where: { id: householdId },
  //   })

  //   if (!household) {
  //     throw new Error('Household not found')
  //   }

  //   // 創建或更新 LINE 群組關聯
  //   await prisma.lineGroup.upsert({
  //     where: { householdId },
  //     update: {
  //       lineGroupId,
  //       name: groupName,
  //     },
  //     create: {
  //       householdId,
  //       lineGroupId,
  //       name: groupName,
  //     },
  //   })

  //   console.log('LINE group linked to household:', { householdId, lineGroupId })
  // } catch (error) {
  //   console.error('Error linking LINE group:', error)
  //   throw error
  // }
}

/**
 * 綁定用戶的 LINE 帳號
 */
export async function linkLineUserToAccount(
  userId: string,
  lineUserId: string,
  displayName?: string,
  pictureUrl?: string
): Promise<void> {
  // TODO: Add LineUser model to Prisma schema first
  throw new Error('LINE integration not yet configured. Add LineUser model to Prisma schema first.')
  
  // try {
  //   await prisma.lineUser.upsert({
  //     where: { userId },
  //     update: {
  //       lineUserId,
  //       displayName,
  //       pictureUrl,
  //     },
  //     create: {
  //       userId,
  //       lineUserId,
  //       displayName,
  //       pictureUrl,
  //     },
  //   })

  //   console.log('LINE user linked to account:', { userId, lineUserId })
  // } catch (error) {
  //   console.error('Error linking LINE user:', error)
  //   throw error
  // }
}

/**
 * 獲取用戶的 LINE 群組（通過 household）
 */
export async function getUserLineGroups(userId: string): Promise<Array<{
  householdId: string
  householdName: string
  lineGroupId: string
  groupName: string
}>> {
  // TODO: Add LineGroup model to Prisma schema first
  return []
  
  // try {
  //   // 獲取用戶的所有 household memberships
  //   const memberships = await prisma.householdMember.findMany({
  //     where: { userId },
  //     include: {
  //       household: {
  //         include: {
  //           lineGroup: true,
  //         },
  //       },
  //     },
  //   })

  //   // 過濾出有 LINE 群組的 household
  //   return memberships
  //     .filter(m => m.household.lineGroup)
  //     .map(m => ({
  //       householdId: m.household.id,
  //       householdName: m.household.name,
  //       lineGroupId: m.household.lineGroup!.lineGroupId,
  //       groupName: m.household.lineGroup!.name,
  //     }))
  // } catch (error) {
  //   console.error('Error getting user LINE groups:', error)
  //   throw error
  // }
}

/**
 * 發送通知到 household 的 LINE 群組
 */
export async function sendHouseholdNotification(
  householdId: string,
  title: string,
  message: string,
  imageUrl?: string
): Promise<void> {
  // TODO: Add LineGroup model to Prisma schema first
  console.log('LINE notification not sent (models not configured):', { householdId, title })
  return
  
  // try {
  //   // 查找 household 的 LINE 群組
  //   const lineGroup = await prisma.lineGroup.findUnique({
  //     where: { householdId },
  //   })

  //   if (!lineGroup) {
  //     console.log('No LINE group found for household:', householdId)
  //     return
  //   }

  //   // 構建消息內容
  //   const fullMessage = `${title}\n\n${message}`

  //   // 發送消息
  //   if (imageUrl) {
  //     await sendLineGroupImage(lineGroup.lineGroupId, imageUrl)
  //   }
    
  //   await sendLineGroupMessage(lineGroup.lineGroupId, fullMessage)

  //   console.log('Notification sent to LINE group:', {
  //     householdId,
  //     lineGroupId: lineGroup.lineGroupId,
  //   })
  // } catch (error) {
  //   console.error('Error sending household notification:', error)
  //   throw error
  // }
}

