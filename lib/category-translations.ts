// Category name translations and normalization
const categoryTranslationsMap = new Map<string, string>([
  // English to normalized key
  ['electronics', 'electronics'],
  ['Electronics', 'electronics'],
  ['ELECTRONICS', 'electronics'],
  ['kitchen', 'kitchen'],
  ['Kitchen', 'kitchen'],
  ['KITCHEN', 'kitchen'],
  ['tools', 'tools'],
  ['Tools', 'tools'],
  ['TOOLS', 'tools'],
  ['clothing', 'clothing'],
  ['Clothing', 'clothing'],
  ['CLOTHING', 'clothing'],
  ['books', 'books'],
  ['Books', 'books'],
  ['BOOKS', 'books'],
  ['bags', 'bags'],
  ['Bags', 'bags'],
  ['BAGS', 'bags'],
  ['t-shirt', 'clothing'],
  ['T-shirt', 'clothing'],
  ['T-SHIRT', 'clothing'],
  ['miscellaneous', 'miscellaneous'],
  ['Miscellaneous', 'miscellaneous'],
  ['MISCELLANEOUS', 'miscellaneous'],
  ['food', 'food'],
  ['Food', 'food'],
  ['FOOD', 'food'],
  ['beverages', 'beverages'],
  ['Beverages', 'beverages'],
  ['BEVERAGES', 'beverages'],
  ['medicine', 'medicine'],
  ['Medicine', 'medicine'],
  ['MEDICINE', 'medicine'],
  ['toiletries', 'toiletries'],
  ['Toiletries', 'toiletries'],
  ['TOILETRIES', 'toiletries'],
  ['cleaning', 'cleaning'],
  ['Cleaning', 'cleaning'],
  ['CLEANING', 'cleaning'],
  ['office', 'office'],
  ['Office', 'office'],
  ['OFFICE', 'office'],
  ['sports', 'sports'],
  ['Sports', 'sports'],
  ['SPORTS', 'sports'],
  ['toys', 'toys'],
  ['Toys', 'toys'],
  ['TOYS', 'toys'],
  ['garden', 'garden'],
  ['Garden', 'garden'],
  ['GARDEN', 'garden'],
  
  // Traditional Chinese to normalized key
  ['電子產品', 'electronics'],
  ['廚房用品', 'kitchen'],
  ['工具', 'tools'],
  ['服裝', 'clothing'],
  ['書籍', 'books'],
  ['包包', 'bags'],
  ['雜項', 'miscellaneous'],
  ['食物', 'food'],
  ['飲料', 'beverages'],
  ['藥品', 'medicine'],
  ['盥洗用品', 'toiletries'],
  ['清潔用品', 'cleaning'],
  ['辦公用品', 'office'],
  ['運動用品', 'sports'],
  ['玩具', 'toys'],
  ['園藝用品', 'garden'],
  ['rs485控制器', 'electronics'],
  
  // Simplified Chinese to normalized key
  ['电子产品', 'electronics'],
  ['厨房用品', 'kitchen'],
  ['工具', 'tools'],
  ['服装', 'clothing'],
  ['书籍', 'books'],
  ['包包', 'bags'],
  ['其他', 'miscellaneous'],
  ['食物', 'food'],
  ['饮料', 'beverages'],
  ['药品', 'medicine'],
  ['盥洗用品', 'toiletries'],
  ['清洁用品', 'cleaning'],
  ['办公用品', 'office'],
  ['运动用品', 'sports'],
  ['玩具', 'toys'],
  ['园艺用品', 'garden'],
  
  // Japanese to normalized key
  ['電子機器', 'electronics'],
  ['キッチン', 'kitchen'],
  ['工具', 'tools'],
  ['衣類', 'clothing'],
  ['本', 'books'],
  ['バッグ', 'bags'],
  ['その他', 'miscellaneous'],
  ['食品', 'food'],
  ['飲料', 'beverages'],
  ['薬品', 'medicine'],
  ['洗面用品', 'toiletries'],
  ['清掃用品', 'cleaning'],
  ['事務用品', 'office'],
  ['スポーツ用品', 'sports'],
  ['おもちゃ', 'toys'],
  ['園芸用品', 'garden'],
])

export const categoryTranslations = Object.fromEntries(categoryTranslationsMap)

// Get normalized key for a category name
export function getNormalizedCategoryKey(categoryName: string): string {
  const trimmed = categoryName.trim()
  return categoryTranslations[trimmed] || trimmed.toLowerCase().replace(/\s+/g, '_')
}

// Get display name for a normalized key in a specific language
export function getCategoryDisplayName(normalizedKey: string, language: string): string {
  const displayNames: Record<string, Record<string, string>> = {
    'electronics': {
      'en': 'Electronics',
      'zh-TW': '電子產品',
      'zh': '电子产品',
      'ja': '電子機器'
    },
    'kitchen': {
      'en': 'Kitchen',
      'zh-TW': '廚房用品',
      'zh': '厨房用品',
      'ja': 'キッチン'
    },
    'tools': {
      'en': 'Tools',
      'zh-TW': '工具',
      'zh': '工具',
      'ja': '工具'
    },
    'clothing': {
      'en': 'Clothing',
      'zh-TW': '服裝',
      'zh': '服装',
      'ja': '衣類'
    },
    'books': {
      'en': 'Books',
      'zh-TW': '書籍',
      'zh': '书籍',
      'ja': '本'
    },
    'bags': {
      'en': 'Bags',
      'zh-TW': '包包',
      'zh': '包包',
      'ja': 'バッグ'
    },
    'miscellaneous': {
      'en': 'Miscellaneous',
      'zh-TW': '雜項',
      'zh': '其他',
      'ja': 'その他'
    },
    'food': {
      'en': 'Food',
      'zh-TW': '食物',
      'zh': '食物',
      'ja': '食品'
    },
    'beverages': {
      'en': 'Beverages',
      'zh-TW': '飲料',
      'zh': '饮料',
      'ja': '飲料'
    },
    'medicine': {
      'en': 'Medicine',
      'zh-TW': '藥品',
      'zh': '药品',
      'ja': '薬品'
    },
    'toiletries': {
      'en': 'Toiletries',
      'zh-TW': '盥洗用品',
      'zh': '盥洗用品',
      'ja': '洗面用品'
    },
    'cleaning': {
      'en': 'Cleaning',
      'zh-TW': '清潔用品',
      'zh': '清洁用品',
      'ja': '清掃用品'
    },
    'office': {
      'en': 'Office',
      'zh-TW': '辦公用品',
      'zh': '办公用品',
      'ja': '事務用品'
    },
    'sports': {
      'en': 'Sports',
      'zh-TW': '運動用品',
      'zh': '运动用品',
      'ja': 'スポーツ用品'
    },
    'toys': {
      'en': 'Toys',
      'zh-TW': '玩具',
      'zh': '玩具',
      'ja': 'おもちゃ'
    },
    'garden': {
      'en': 'Garden',
      'zh-TW': '園藝用品',
      'zh': '园艺用品',
      'ja': '園芸用品'
    }
  }
  
  return displayNames[normalizedKey]?.[language] || normalizedKey
}
