// Location translation system for rooms, cabinets, and categories
// This handles dynamic translation of location-based entities

import { translateText } from './dynamic-translations'

// Room name translations
const ROOM_TRANSLATIONS: Record<string, Record<string, string>> = {
  // English to other languages
  'Master Bedroom': {
    'zh-TW': '主臥室',
    'zh': '主臥室',
    'ja': 'マスターベッドルーム'
  },
  'Kitchen': {
    'zh-TW': '廚房',
    'zh': '廚房', 
    'ja': 'キッチン'
  },
  'Living Room': {
    'zh-TW': '客廳',
    'zh': '客廳',
    'ja': 'リビングルーム'
  },
  'Garage': {
    'zh-TW': '車庫',
    'zh': '車庫',
    'ja': 'ガレージ'
  },
  'Kids Room': {
    'zh-TW': '兒童房',
    'zh': '兒童房',
    'ja': '子供部屋'
  }
}

// Cabinet name translations
const CABINET_TRANSLATIONS: Record<string, Record<string, string>> = {
  // English to other languages
  'Main Cabinet': {
    'zh-TW': '主櫥櫃',
    'zh': '主櫥櫃',
    'ja': 'メインキャビネット'
  },
  'Side Cabinet': {
    'zh-TW': '側櫥櫃',
    'zh': '側櫥櫃', 
    'ja': 'サイドキャビネット'
  },
  'Right Cabinet': {
    'zh-TW': '右櫥櫃',
    'zh': '右櫥櫃',
    'ja': '右キャビネット'
  },
  'Left Cabinet': {
    'zh-TW': '左櫥櫃',
    'zh': '左櫥櫃',
    'ja': '左キャビネット'
  },
  'Middle Cabinet': {
    'zh-TW': '中櫥櫃',
    'zh': '中櫥櫃',
    'ja': '中央キャビネット'
  },
  'Default Cabinet': {
    'zh-TW': '主櫃',
    'zh': '主櫃',
    'ja': 'デフォルトキャビネット'
  },
  'Closet': {
    'zh-TW': '衣櫃',
    'zh': '衣櫃',
    'ja': 'クローゼット'
  },
  'Dresser': {
    'zh-TW': '梳妝台',
    'zh': '梳妝台',
    'ja': 'ドレッサー'
  }
}

// Category name translations
const CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  // English to other languages
  'Electronics': {
    'zh-TW': '電子產品',
    'zh': '电子产品',
    'ja': '電子機器'
  },
  'Tools': {
    'zh-TW': '工具',
    'zh': '工具',
    'ja': '工具'
  },
  'Clothing': {
    'zh-TW': '服裝',
    'zh': '服装',
    'ja': '衣類'
  },
  'Books': {
    'zh-TW': '書籍',
    'zh': '书籍',
    'ja': '本'
  },
  'Miscellaneous': {
    'zh-TW': '雜項',
    'zh': '杂项',
    'ja': 'その他'
  },
  'Kitchen': {
    'zh-TW': '廚房用品',
    'zh': '厨房用品',
    'ja': 'キッチン用品'
  },
  'Food': {
    'zh-TW': '食物',
    'zh': '食物',
    'ja': '食べ物'
  },
  'Beverages': {
    'zh-TW': '飲料',
    'zh': '饮料',
    'ja': '飲み物'
  },
  'Bags': {
    'zh-TW': '包包',
    'zh': '包包',
    'ja': 'バッグ'
  },
  'Upper Garment': {
    'zh-TW': '上衣',
    'zh': '上衣',
    'ja': '上着'
  },
  'T-shirt': {
    'zh-TW': 'T恤',
    'zh': 'T恤',
    'ja': 'Tシャツ'
  },
  '家電': {
    'en': 'Home Appliances',
    'zh': '家电',
    'ja': '家電'
  },
  '零食': {
    'en': 'Snacks',
    'zh': '零食',
    'ja': 'おやつ'
  },
  '盤子': {
    'en': 'Plates',
    'zh': '盘子',
    'ja': 'お皿'
  },
  '鍋子': {
    'en': 'Pots',
    'zh': '锅子',
    'ja': '鍋'
  },
  '下衣': {
    'en': 'Lower Garment',
    'zh': '下衣',
    'ja': '下着'
  },
  '女裙': {
    'en': 'Skirts',
    'zh': '女裙',
    'ja': 'スカート'
  },
  '男褲': {
    'en': 'Pants',
    'zh': '男裤',
    'ja': 'パンツ'
  }
}

// Create reverse lookup maps for Chinese to English
const createReverseMaps = () => {
  const reverseRoomMap: Record<string, string> = {}
  const reverseCabinetMap: Record<string, string> = {}
  const reverseCategoryMap: Record<string, string> = {}

  // Build reverse maps
  Object.entries(ROOM_TRANSLATIONS).forEach(([en, translations]) => {
    Object.values(translations).forEach(chinese => {
      reverseRoomMap[chinese] = en
    })
  })

  Object.entries(CABINET_TRANSLATIONS).forEach(([en, translations]) => {
    Object.values(translations).forEach(chinese => {
      reverseCabinetMap[chinese] = en
    })
  })

  Object.entries(CATEGORY_TRANSLATIONS).forEach(([en, translations]) => {
    Object.values(translations).forEach(chinese => {
      reverseCategoryMap[chinese] = en
    })
  })

  return { reverseRoomMap, reverseCabinetMap, reverseCategoryMap }
}

export function translateRoomName(roomName: string, targetLanguage: string): string {
  if (!roomName || targetLanguage === 'en') {
    return roomName
  }

  // Check direct translations first
  if (ROOM_TRANSLATIONS[roomName] && ROOM_TRANSLATIONS[roomName][targetLanguage]) {
    return ROOM_TRANSLATIONS[roomName][targetLanguage]
  }

  // Check reverse lookup (Chinese to English then to target language)
  const { reverseRoomMap } = createReverseMaps()
  if (reverseRoomMap[roomName]) {
    const englishName = reverseRoomMap[roomName]
    if (ROOM_TRANSLATIONS[englishName] && ROOM_TRANSLATIONS[englishName][targetLanguage]) {
      return ROOM_TRANSLATIONS[englishName][targetLanguage]
    }
  }

  return roomName
}

export function translateCabinetName(cabinetName: string, targetLanguage: string): string {
  if (!cabinetName || targetLanguage === 'en') {
    return cabinetName
  }

  // Check direct translations first
  if (CABINET_TRANSLATIONS[cabinetName] && CABINET_TRANSLATIONS[cabinetName][targetLanguage]) {
    return CABINET_TRANSLATIONS[cabinetName][targetLanguage]
  }

  // Check reverse lookup (Chinese to English then to target language)
  const { reverseCabinetMap } = createReverseMaps()
  if (reverseCabinetMap[cabinetName]) {
    const englishName = reverseCabinetMap[cabinetName]
    if (CABINET_TRANSLATIONS[englishName] && CABINET_TRANSLATIONS[englishName][targetLanguage]) {
      return CABINET_TRANSLATIONS[englishName][targetLanguage]
    }
  }

  return cabinetName
}

export function translateCategoryName(categoryName: string, targetLanguage: string): string {
  if (!categoryName || targetLanguage === 'en') {
    return categoryName
  }

  // Check direct translations first
  if (CATEGORY_TRANSLATIONS[categoryName] && CATEGORY_TRANSLATIONS[categoryName][targetLanguage]) {
    return CATEGORY_TRANSLATIONS[categoryName][targetLanguage]
  }

  // Check reverse lookup (Chinese to English then to target language)
  const { reverseCategoryMap } = createReverseMaps()
  if (reverseCategoryMap[categoryName]) {
    const englishName = reverseCategoryMap[categoryName]
    if (CATEGORY_TRANSLATIONS[englishName] && CATEGORY_TRANSLATIONS[englishName][targetLanguage]) {
      return CATEGORY_TRANSLATIONS[englishName][targetLanguage]
    }
  }

  return categoryName
}

// Enhanced item content translation that supports all languages
export async function translateItemContentEnhanced(content: string, targetLanguage: string): Promise<string> {
  if (!content || targetLanguage === 'en') {
    return content
  }

  // Create fallback translations map for common item content
  const fallbackTranslations: Record<string, string> = {
    // Add common item translations
    '日本製銀色天然礦泉水瓶 400ml': 'Japanese Silver Natural Mineral Water Bottle 400ml',
    'Panasonic 黑色多功能遙控器': 'Panasonic Black Multifunction Remote Control',
    '白色短袖T恤': 'White Short Sleeve T-Shirt',
    '這是一個銀色的天然礦泉水瓶,容量為400毫升,瓶身上印有綠色水滴圖案,標示為日本製造。': 'This is a silver natural mineral water bottle, with a capacity of 400ml, with a green water drop pattern printed on the bottle, marked as made in Japan.',
    '這是一款黑色的Panasonic遙控器,具有多個流媒體按鈕如Netflix、Hulu、YouTube等,適用於控制多種設備。': 'This is a black Panasonic remote control, with multiple streaming media buttons such as Netflix, Hulu, YouTube, etc., suitable for controlling multiple devices.',
    '這是一件白色的短袖T恤,上面印有 \'THE COME MUSIC\' 字樣,並有紅色、藍色和黑色的條紋設計。': 'This is a white short-sleeved T-shirt, with \'THE COME MUSIC\' printed on it, and red, blue, and black stripe designs.'
  }

  // Check fallback translations first (fastest)
  if (fallbackTranslations[content]) {
    return fallbackTranslations[content]
  }

  // Try dynamic translation for new content
  try {
    return await translateText(content, targetLanguage, fallbackTranslations)
  } catch (error) {
    console.error('Dynamic translation error:', error)
    return content
  }
}
