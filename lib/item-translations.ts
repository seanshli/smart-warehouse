// Centralized item translation system
// This file contains translations for items that were added in non-English languages

export interface ItemTranslation {
  original: string
  english: string
  type: 'name' | 'description'
}

export const ITEM_TRANSLATIONS: ItemTranslation[] = [
  // Item Names
  {
    original: '日本製銀色天然礦泉水瓶 400ml',
    english: 'Japanese Silver Natural Mineral Water Bottle 400ml',
    type: 'name'
  },
  {
    original: 'Panasonic 黑色多功能遙控器',
    english: 'Panasonic Black Multifunction Remote Control',
    type: 'name'
  },
  {
    original: '白色短袖T恤',
    english: 'White Short Sleeve T-Shirt',
    type: 'name'
  },
  
  // Item Descriptions
  {
    original: '這是一個銀色的天然礦泉水瓶,容量為400毫升,瓶身上印有綠色水滴圖案,標示為日本製造。',
    english: 'This is a silver natural mineral water bottle, with a capacity of 400ml, with a green water drop pattern printed on the bottle, marked as made in Japan.',
    type: 'description'
  },
  {
    original: '這是一款黑色的Panasonic遙控器,具有多個流媒體按鈕如Netflix、Hulu、YouTube等,適用於控制多種設備。',
    english: 'This is a black Panasonic remote control, with multiple streaming media buttons such as Netflix, Hulu, YouTube, etc., suitable for controlling multiple devices.',
    type: 'description'
  },
  {
    original: '這是一件白色的短袖T恤,上面印有 \'THE COME MUSIC\' 字樣,並有紅色、藍色和黑色的條紋設計。',
    english: 'This is a white short-sleeved T-shirt, with \'THE COME MUSIC\' printed on it, and red, blue, and black stripe designs.',
    type: 'description'
  }
]

export function translateItemContent(content: string, targetLanguage: string): string {
  if (targetLanguage !== 'en') {
    console.log('Translation skipped - target language is not English:', targetLanguage)
    return content
  }
  
  // Create a lookup map for faster access
  const translationMap = new Map<string, string>()
  ITEM_TRANSLATIONS.forEach(translation => {
    translationMap.set(translation.original, translation.english)
  })
  
  const result = translationMap.get(content) || content
  
  // Debug logging
  if (result !== content) {
    console.log('Translation applied:', { original: content, translated: result })
  } else {
    console.log('No translation found for:', content)
  }
  
  return result
}

export function addItemTranslation(original: string, english: string, type: 'name' | 'description') {
  // This function can be used to dynamically add new translations
  // For now, we'll just add them to the array above
  ITEM_TRANSLATIONS.push({ original, english, type })
}
