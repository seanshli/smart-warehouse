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
  // Level 2 subcategories
  ['飲具', 'drinkware'],
  ['鍋具', 'pots_and_pans'],
  ['餐具', 'dishes'],
  ['廚具', 'utensil'],
  ['上衣', 'top'],
  ['下身', 'bottom'],
  ['外套', 'jacket'],
  ['T恤', 't_shirt'],
  ['襯衫', 'shirt'],
  ['褲子', 'pants'],
  ['裙子', 'skirt'],
  ['茶飲料', 'tea_beverages'],
  
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
    // Level 1 categories
    'accessory': {
      'en': 'Accessory',
      'zh-TW': '配件',
      'zh': '配件',
      'ja': 'アクセサリー'
    },
    'book': {
      'en': 'Book',
      'zh-TW': '書籍',
      'zh': '书籍',
      'ja': '本'
    },
    'clothes': {
      'en': 'Clothes',
      'zh-TW': '衣服',
      'zh': '衣服',
      'ja': '服'
    },
    'electronics': {
      'en': 'Electronics',
      'zh-TW': '電子產品',
      'zh': '电子产品',
      'ja': '電子機器'
    },
    'kitchenware': {
      'en': 'Kitchenware',
      'zh-TW': '廚房用品',
      'zh': '厨房用品',
      'ja': 'キッチン用品'
    },
    'mics': {
      'en': 'Miscellaneous',
      'zh-TW': '雜項',
      'zh': '杂项',
      'ja': 'その他'
    },
    'tools': {
      'en': 'Tools',
      'zh-TW': '工具',
      'zh': '工具',
      'ja': '工具'
    },
    
    // Level 2 - Kitchenware subcategories
    'pots_and_pans': {
      'en': 'Pots and Pans',
      'zh-TW': '鍋具',
      'zh': '锅具',
      'ja': '鍋類'
    },
    'drinkware': {
      'en': 'Drinkware',
      'zh-TW': '飲具',
      'zh': '饮具',
      'ja': '飲料容器'
    },
    'dishes': {
      'en': 'Dishes',
      'zh-TW': '餐具',
      'zh': '餐具',
      'ja': '食器'
    },
    'utensil': {
      'en': 'Utensil',
      'zh-TW': '廚具',
      'zh': '厨具',
      'ja': '調理器具'
    },
    
    // Level 2 - Clothes subcategories
    'top': {
      'en': 'Top',
      'zh-TW': '上衣',
      'zh': '上衣',
      'ja': 'トップス'
    },
    'bottom': {
      'en': 'Bottom',
      'zh-TW': '下身',
      'zh': '下身',
      'ja': 'ボトムス'
    },
    
    // Level 3 - Top subcategories
    'jacket': {
      'en': 'Jacket',
      'zh-TW': '外套',
      'zh': '外套',
      'ja': 'ジャケット'
    },
    't_shirt': {
      'en': 'T-Shirt',
      'zh-TW': 'T恤',
      'zh': 'T恤',
      'ja': 'Tシャツ'
    },
    'shirt': {
      'en': 'Shirt',
      'zh-TW': '襯衫',
      'zh': '衬衫',
      'ja': 'シャツ'
    },
    
    // Level 3 - Bottom subcategories
    'pants': {
      'en': 'Pants',
      'zh-TW': '褲子',
      'zh': '裤子',
      'ja': 'ズボン'
    },
    'skirt': {
      'en': 'Skirt',
      'zh-TW': '裙子',
      'zh': '裙子',
      'ja': 'スカート'
    },
    
    // Legacy categories
    'kitchen': {
      'en': 'Kitchen',
      'zh-TW': '廚房用品',
      'zh': '厨房用品',
      'ja': 'キッチン'
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
    'tea_beverages': {
      'en': 'Tea Beverages',
      'zh-TW': '茶飲料',
      'zh': '茶饮料',
      'ja': '茶飲料'
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
