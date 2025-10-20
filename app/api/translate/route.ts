import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { text, targetLanguage, sourceLanguage } = await request.json()

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If source and target are the same, return original text
    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({ translatedText: text })
    }

    // Simple translation mapping for common terms
    const translations: Record<string, Record<string, string>> = {
      // Room names
      'Master Bedroom': {
        'en': 'Master Bedroom',
        'zh-TW': '主臥室',
        'zh': '主卧室',
        'ja': 'マスターベッドルーム'
      },
      '主臥室': {
        'en': 'Master Bedroom',
        'zh-TW': '主臥室',
        'zh': '主卧室',
        'ja': 'マスターベッドルーム'
      },
      'Kitchen': {
        'en': 'Kitchen',
        'zh-TW': '廚房',
        'zh': '厨房',
        'ja': 'キッチン'
      },
      '廚房': {
        'en': 'Kitchen',
        'zh-TW': '廚房',
        'zh': '厨房',
        'ja': 'キッチン'
      },
      'Living Room': {
        'en': 'Living Room',
        'zh-TW': '客廳',
        'zh': '客厅',
        'ja': 'リビングルーム'
      },
      '客廳': {
        'en': 'Living Room',
        'zh-TW': '客廳',
        'zh': '客厅',
        'ja': 'リビングルーム'
      },
      'Garage': {
        'en': 'Garage',
        'zh-TW': '車庫',
        'zh': '车库',
        'ja': 'ガレージ'
      },
      '車庫': {
        'en': 'Garage',
        'zh-TW': '車庫',
        'zh': '车库',
        'ja': 'ガレージ'
      },
      // Cabinet names
      'Main Cabinet': {
        'en': 'Main Cabinet',
        'zh-TW': '主櫥櫃',
        'zh': '主橱柜',
        'ja': 'メインキャビネット'
      },
      '主櫥櫃': {
        'en': 'Main Cabinet',
        'zh-TW': '主櫥櫃',
        'zh': '主橱柜',
        'ja': 'メインキャビネット'
      },
      'Side Cabinet': {
        'en': 'Side Cabinet',
        'zh-TW': '側櫥櫃',
        'zh': '侧橱柜',
        'ja': 'サイドキャビネット'
      },
      '側櫥櫃': {
        'en': 'Side Cabinet',
        'zh-TW': '側櫥櫃',
        'zh': '侧橱柜',
        'ja': 'サイドキャビネット'
      },
      'Right Cabinet': {
        'en': 'Right Cabinet',
        'zh-TW': '右櫥櫃',
        'zh': '右橱柜',
        'ja': '右キャビネット'
      },
      '右櫥櫃': {
        'en': 'Right Cabinet',
        'zh-TW': '右櫥櫃',
        'zh': '右橱柜',
        'ja': '右キャビネット'
      },
      'Left Cabinet': {
        'en': 'Left Cabinet',
        'zh-TW': '左櫥櫃',
        'zh': '左橱柜',
        'ja': '左キャビネット'
      },
      '左櫥櫃': {
        'en': 'Left Cabinet',
        'zh-TW': '左櫥櫃',
        'zh': '左橱柜',
        'ja': '左キャビネット'
      },
      // Category names
      'Food': {
        'en': 'Food',
        'zh-TW': '食品',
        'zh': '食品',
        'ja': '食品'
      },
      '食品': {
        'en': 'Food',
        'zh-TW': '食品',
        'zh': '食品',
        'ja': '食品'
      },
      'Snacks': {
        'en': 'Snacks',
        'zh-TW': '零食',
        'zh': '零食',
        'ja': 'スナック'
      },
      '零食': {
        'en': 'Snacks',
        'zh-TW': '零食',
        'zh': '零食',
        'ja': 'スナック'
      },
      'Clothing': {
        'en': 'Clothing',
        'zh-TW': '服裝',
        'zh': '服装',
        'ja': '衣類'
      },
      '服裝': {
        'en': 'Clothing',
        'zh-TW': '服裝',
        'zh': '服装',
        'ja': '衣類'
      },
      'Electronics': {
        'en': 'Electronics',
        'zh-TW': '電子產品',
        'zh': '电子产品',
        'ja': '電子機器'
      },
      '電子產品': {
        'en': 'Electronics',
        'zh-TW': '電子產品',
        'zh': '电子产品',
        'ja': '電子機器'
      }
    }

    // Check if we have a direct translation
    if (translations[text] && translations[text][targetLanguage]) {
      return NextResponse.json({ translatedText: translations[text][targetLanguage] })
    }

    // For now, return the original text if no translation is found
    // In a real implementation, this would call an AI translation service
    return NextResponse.json({ translatedText: text })

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
