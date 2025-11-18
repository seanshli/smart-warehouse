// 取出物品 API 路由
// 處理從倉庫中取出物品的請求，減少物品數量，記錄操作歷史，支援語音備註轉文字

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CacheInvalidation } from '@/lib/cache'
import { checkAndCreateNotifications } from '@/lib/notifications'
import { transcribeAudioFormData } from '@/lib/speech-to-text'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// POST 處理器：取出物品（減少庫存）
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const itemId = params.id // 物品 ID
    const body = await request.json()

    // 驗證用戶有權限存取此物品
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        household: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const checkoutQuantity = parseInt(body.quantity) // 取出數量
    const reason = body.reason || 'Checked out' // 取出原因
    const voiceUrl = body.voiceUrl || null // 語音備註（Base64）

    // 驗證取出數量
    if (checkoutQuantity <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    // 驗證取出數量不超過可用數量
    if (checkoutQuantity > item.quantity) {
      return NextResponse.json({ error: 'Cannot checkout more items than available' }, { status: 400 })
    }

    // 更新物品數量
    const newQuantity = item.quantity - checkoutQuantity
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity, // 新數量
        updatedAt: new Date() // 更新時間
      },
      include: {
        category: {
          include: {
            parent: true // 包含父分類
          }
        },
        room: true, // 包含房間資訊
        cabinet: true // 包含櫃子資訊
      }
    })

    // 構建操作描述（包含原因）
    let description = `Item checked out. Quantity decreased from ${item.quantity} to ${newQuantity}`
    if (reason && reason.trim() !== 'Checked out') {
      description += `. Reason: ${reason}`
    }

    // 如果有語音備註，進行語音轉文字（非阻塞）
    let voiceTranscript: string | null = null
    if (voiceUrl) {
      try {
        // 獲取用戶的語言偏好以獲得更好的轉錄效果
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { language: true }
        })
        const userLanguage = user?.language || 'en'
        
        // 將語言代碼映射為 Whisper 格式（en, zh, ja 等）
        const whisperLanguage = userLanguage === 'zh-TW' || userLanguage === 'zh' ? 'zh' : 
                                userLanguage === 'ja' ? 'ja' : 'en'
        
        const transcript = await transcribeAudioFormData(voiceUrl, whisperLanguage)
        if (transcript) {
          voiceTranscript = transcript
          // 將轉錄文字附加到描述中以便搜尋
          description += `. Voice note: "${transcript}"`
        }
      } catch (error) {
        console.error('Failed to transcribe voice comment:', error)
        // 繼續執行，即使轉錄失敗也不影響主要流程
      }
    }

    // 記錄取出活動（包含語音備註和轉錄文字，如果可用）
    await (prisma as any).itemHistory.create({
      data: {
        itemId: itemId, // 物品 ID
        action: 'checkout', // 操作類型：取出
        description: description, // 操作描述
        voiceUrl: voiceUrl ? `data:audio/webm;codecs=opus;base64,${voiceUrl}` : null, // 語音備註 URL
        voiceTranscript: voiceTranscript, // 語音轉文字
        performedBy: userId // 執行者
      }
    })

    // 為取出操作創建通知（特別是低庫存通知）
    try {
      await checkAndCreateNotifications(updatedItem, userId, 'updated', item)
    } catch (error) {
      console.error('Failed to create notifications for checkout:', error)
    }

    // 清除快取以確保 UI 反映更新後的數量
    if (item.householdId) {
      CacheInvalidation.clearItemCache(item.householdId)
      console.log('Checkout: Cleared cache for household:', item.householdId)
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error checking out item:', error)
    return NextResponse.json({ error: 'Failed to checkout item' }, { status: 500 })
  }
}