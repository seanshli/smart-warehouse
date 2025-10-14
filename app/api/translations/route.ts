import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  translateText, 
  translateBatch, 
  getTranslationStats, 
  clearTranslationCache 
} from '@/lib/dynamic-translations'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET - Get translation statistics and cached translations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = getTranslationStats()
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting translation stats:', error)
    return NextResponse.json(
      { error: 'Failed to get translation stats' },
      { status: 500 }
    )
  }
}

// POST - Translate text or batch of texts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, texts, targetLanguage = 'en' } = body

    if (!text && !texts) {
      return NextResponse.json({ error: 'Text or texts required' }, { status: 400 })
    }

    if (text) {
      // Single text translation
      const translation = await translateText(text, targetLanguage)
      return NextResponse.json({
        success: true,
        original: text,
        translated: translation,
        targetLanguage
      })
    } else if (texts && Array.isArray(texts)) {
      // Batch translation
      const translations = await translateBatch(texts, targetLanguage)
      return NextResponse.json({
        success: true,
        originals: texts,
        translations,
        targetLanguage
      })
    }

  } catch (error) {
    console.error('Error translating text:', error)
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    )
  }
}

// DELETE - Clear translation cache
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    clearTranslationCache()
    
    return NextResponse.json({
      success: true,
      message: 'Translation cache cleared successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error clearing translation cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear translation cache' },
      { status: 500 }
    )
  }
}
