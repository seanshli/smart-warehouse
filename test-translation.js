// Test script for translation functions
const { translateRoomName, translateCabinetName, translateCategoryName, translateItemContentEnhanced } = require('./lib/location-translations.ts')

async function testTranslations() {
  console.log('Testing Translation Functions:')
  console.log('================================')
  
  // Test room translations
  console.log('\nRoom Translations:')
  console.log('English "Master Bedroom" -> Chinese:', translateRoomName('Master Bedroom', 'zh-TW'))
  console.log('Chinese "主臥室" -> English:', translateRoomName('主臥室', 'en'))
  
  // Test cabinet translations
  console.log('\nCabinet Translations:')
  console.log('English "Main Cabinet" -> Chinese:', translateCabinetName('Main Cabinet', 'zh-TW'))
  console.log('Chinese "主櫥櫃" -> English:', translateCabinetName('主櫥櫃', 'en'))
  
  // Test category translations
  console.log('\nCategory Translations:')
  console.log('English "Electronics" -> Chinese:', translateCategoryName('Electronics', 'zh-TW'))
  console.log('Chinese "家電" -> English:', translateCategoryName('家電', 'en'))
  
  // Test item content translations
  console.log('\nItem Content Translations:')
  const itemName = await translateItemContentEnhanced('Panasonic 黑色多功能遙控器', 'en')
  console.log('Chinese item name -> English:', itemName)
}

testTranslations().catch(console.error)
