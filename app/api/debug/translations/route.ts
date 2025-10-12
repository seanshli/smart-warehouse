import { NextRequest, NextResponse } from 'next/server'
import { translateCategoryName, getTranslations } from '@/lib/translations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'zh-TW'
    
    // Test category name translations
    const testCategories = ['Electronics', 'Tools', 'Clothing', 'Books', 'Miscellaneous']
    
    const translations = testCategories.map(category => ({
      original: category,
      translated: translateCategoryName(category, language),
      language: language
    }))
    
    // Get full translations object
    const fullTranslations = getTranslations(language)
    
    return NextResponse.json({
      language: language,
      categoryTranslations: translations,
      fullTranslations: {
        electronics: fullTranslations.electronics,
        tools: fullTranslations.tools,
        clothing: fullTranslations.clothing,
        books: fullTranslations.books,
        miscellaneous: fullTranslations.miscellaneous,
        categoryNameTranslations: fullTranslations.categoryNameTranslations
      }
    })
  } catch (error) {
    console.error('Error in debug translations:', error)
    return NextResponse.json(
      { error: 'Failed to debug translations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
