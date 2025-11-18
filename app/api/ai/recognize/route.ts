// AI 識別 API 路由
// 處理圖片、條碼和條碼圖片的 AI 識別請求，支援多種識別模式

import { NextRequest, NextResponse } from 'next/server'
import { recognizeItemFromBarcode, recognizeItemFromBarcodeImage, recognizeItemFromImage } from '@/lib/ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// POST 處理器：處理 AI 識別請求
export async function POST(request: NextRequest) {
  try {
    console.log('=== AI Recognition API Called ===')
    
    // 驗證用戶會話
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()
    const { type, imageBase64, barcode } = body // 識別類型、Base64 圖片、條碼字串

    console.log('Request type:', type)
    console.log('Image base64 length:', imageBase64?.length || 0)
    console.log('Barcode:', barcode)

    // 獲取用戶的語言偏好設定
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true }
    })
    
    const userLanguage = user?.language || 'en' // 預設為英語
    console.log('User language:', userLanguage)

    let result

    // 根據識別類型呼叫對應的識別函數
    switch (type) {
      case 'image':
        // 圖片識別（使用 OpenAI Vision API）
        console.log('Calling recognizeItemFromImage...')
        result = await recognizeItemFromImage(imageBase64, userLanguage)
        break
      case 'barcode':
        // 條碼識別（使用 OpenAI 或條碼資料庫查詢）
        console.log('Calling recognizeItemFromBarcode...')
        result = await recognizeItemFromBarcode(barcode, userLanguage)
        break
      case 'barcode-image':
        // 條碼圖片識別（從圖片中提取條碼）
        console.log('Calling recognizeItemFromBarcodeImage...')
        result = await recognizeItemFromBarcodeImage(imageBase64)
        break
      default:
        console.log('Invalid recognition type:', type)
        return NextResponse.json({ error: 'Invalid recognition type' }, { status: 400 })
    }

    console.log('AI Recognition result:', result)

    // 將語言資訊添加到結果中
    result.language = userLanguage

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI recognition API error:', error)
    console.error('Error stack:', (error as Error).stack)
    return NextResponse.json(
      { 
        error: 'Failed to recognize item',
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}