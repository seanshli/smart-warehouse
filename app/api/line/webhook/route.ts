import { NextRequest, NextResponse } from 'next/server'
import { Client, middleware, WebhookEvent, TextMessage, Message } from '@line/bot-sdk'
import { prisma } from '@/lib/prisma'

// LINE Client 配置
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
})

// 驗證 LINE Webhook 簽名
const lineMiddleware = middleware({
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
})

export const dynamic = 'force-dynamic'

/**
 * POST /api/line/webhook
 * LINE Webhook 端點 - 接收 LINE 消息
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-line-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // 驗證簽名（簡化版，實際應該使用 @line/bot-sdk 的 middleware）
    // 這裡僅作為示例，實際實現需要使用正確的驗證方法

    const events: WebhookEvent[] = JSON.parse(body).events

    // 處理每個事件
    for (const event of events) {
      await handleLineEvent(event)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('LINE Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * 處理 LINE 事件
 */
async function handleLineEvent(event: WebhookEvent) {
  try {
    switch (event.type) {
      case 'message':
        await handleMessageEvent(event)
        break
      case 'memberJoined':
        await handleMemberJoinedEvent(event)
        break
      case 'memberLeft':
        await handleMemberLeftEvent(event)
        break
      case 'follow':
        await handleFollowEvent(event)
        break
      case 'unfollow':
        await handleUnfollowEvent(event)
        break
      default:
        console.log('Unhandled event type:', event.type)
    }
  } catch (error) {
    console.error('Error handling LINE event:', error)
  }
}

/**
 * 處理消息事件
 */
async function handleMessageEvent(event: WebhookEvent) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return
  }

  const textMessage = event.message as TextMessage
  const lineUserId = event.source.userId || ''
  const groupId = event.source.type === 'group' ? event.source.groupId : null

  // 查找對應的用戶和 household
  const lineUser = await prisma.lineUser.findUnique({
    where: { lineUserId },
    include: { user: true },
  })

  if (!lineUser || !groupId) {
    console.log('LINE user not found or not a group message:', { lineUserId, groupId })
    return
  }

  // 查找對應的 LINE 群組和 household
  const lineGroup = await prisma.lineGroup.findUnique({
    where: { lineGroupId: groupId },
    include: { household: true },
  })

  if (!lineGroup) {
    console.log('LINE group not found:', groupId)
    return
  }

  // 保存消息到數據庫
  await prisma.lineMessage.create({
    data: {
      lineMessageId: event.message.id,
      lineUserId,
      messageType: 'text',
      content: textMessage.text,
      metadata: {
        timestamp: event.timestamp,
        replyToken: event.replyToken,
      },
    },
  })

  // 同步到系統內的 Conversation
  const conversation = await getOrCreateConversation(
    lineUser.userId,
    lineGroup.householdId,
    'general'
  )

  // 創建系統內的消息記錄
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: lineUser.userId,
      content: textMessage.text,
      messageType: 'text',
      metadata: {
        source: 'line',
        lineMessageId: event.message.id,
      },
    },
  })

  console.log('LINE message synced:', {
    lineUserId,
    householdId: lineGroup.householdId,
    conversationId: conversation.id,
  })
}

/**
 * 處理成員加入事件
 */
async function handleMemberJoinedEvent(event: WebhookEvent) {
  if (event.type !== 'memberJoined') return

  const groupId = event.source.type === 'group' ? event.source.groupId : null
  if (!groupId) return

  console.log('Member joined LINE group:', groupId)
  // 可以發送歡迎消息等
}

/**
 * 處理成員離開事件
 */
async function handleMemberLeftEvent(event: WebhookEvent) {
  if (event.type !== 'memberLeft') return

  const groupId = event.source.type === 'group' ? event.source.groupId : null
  if (!groupId) return

  console.log('Member left LINE group:', groupId)
}

/**
 * 處理關注事件（用戶添加官方帳號為好友）
 */
async function handleFollowEvent(event: WebhookEvent) {
  if (event.type !== 'follow') return

  const lineUserId = event.source.userId
  console.log('User followed LINE account:', lineUserId)
  
  // 可以發送歡迎消息
  if (lineUserId) {
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '歡迎使用 Smart Warehouse！請在應用中綁定您的 LINE 帳號以開始使用。',
    })
  }
}

/**
 * 處理取消關注事件
 */
async function handleUnfollowEvent(event: WebhookEvent) {
  if (event.type !== 'unfollow') return

  const lineUserId = event.source.userId
  console.log('User unfollowed LINE account:', lineUserId)
}

/**
 * 獲取或創建對話
 */
async function getOrCreateConversation(
  userId: string,
  householdId: string,
  type: string = 'general'
) {
  // 查找現有對話
  let conversation = await prisma.conversation.findFirst({
    where: {
      householdId,
      type,
      status: 'active',
    },
  })

  // 如果不存在，創建新對話
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        householdId,
        createdBy: userId,
        type,
        status: 'active',
      },
    })
  }

  return conversation
}

