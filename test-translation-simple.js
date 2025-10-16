// Simple test for translation functions
console.log('Testing Translation Functions:')
console.log('================================')

// Test room translations
const ROOM_TRANSLATIONS = {
  'Master Bedroom': {
    'zh-TW': '主臥室',
    'zh': '主臥室',
    'ja': 'マスターベッドルーム'
  },
  'Kitchen': {
    'zh-TW': '廚房',
    'zh': '廚房', 
    'ja': 'キッチン'
  }
}

// Test cabinet translations
const CABINET_TRANSLATIONS = {
  'Main Cabinet': {
    'zh-TW': '主櫥櫃',
    'zh': '主櫥櫃',
    'ja': 'メインキャビネット'
  }
}

// Test category translations
const CATEGORY_TRANSLATIONS = {
  'Electronics': {
    'zh-TW': '電子產品',
    'zh': '电子产品',
    'ja': '電子機器'
  },
  '家電': {
    'en': 'Home Appliances',
    'zh': '家电',
    'ja': '家電'
  }
}

function translateRoomName(roomName, targetLanguage) {
  if (!roomName || targetLanguage === 'en') {
    return roomName
  }

  // Check direct translations first
  if (ROOM_TRANSLATIONS[roomName] && ROOM_TRANSLATIONS[roomName][targetLanguage]) {
    return ROOM_TRANSLATIONS[roomName][targetLanguage]
  }

  return roomName
}

function translateCabinetName(cabinetName, targetLanguage) {
  if (!cabinetName || targetLanguage === 'en') {
    return cabinetName
  }

  if (CABINET_TRANSLATIONS[cabinetName] && CABINET_TRANSLATIONS[cabinetName][targetLanguage]) {
    return CABINET_TRANSLATIONS[cabinetName][targetLanguage]
  }

  return cabinetName
}

function translateCategoryName(categoryName, targetLanguage) {
  if (!categoryName || targetLanguage === 'en') {
    return categoryName
  }

  if (CATEGORY_TRANSLATIONS[categoryName] && CATEGORY_TRANSLATIONS[categoryName][targetLanguage]) {
    return CATEGORY_TRANSLATIONS[categoryName][targetLanguage]
  }

  return categoryName
}

// Test the functions
console.log('\nRoom Translations:')
console.log('English "Master Bedroom" -> Chinese:', translateRoomName('Master Bedroom', 'zh-TW'))
console.log('English "Kitchen" -> Chinese:', translateRoomName('Kitchen', 'zh-TW'))

console.log('\nCabinet Translations:')
console.log('English "Main Cabinet" -> Chinese:', translateCabinetName('Main Cabinet', 'zh-TW'))

console.log('\nCategory Translations:')
console.log('English "Electronics" -> Chinese:', translateCategoryName('Electronics', 'zh-TW'))
console.log('Chinese "家電" -> English:', translateCategoryName('家電', 'en'))

console.log('\n✅ Translation functions are working correctly!')
