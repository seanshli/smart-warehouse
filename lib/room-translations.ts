// Room name translations and normalization
const roomTranslationsMap = new Map<string, string>([
  // English to normalized key
  ['kitchen', 'kitchen'],
  ['Kitchen', 'kitchen'],
  ['KITCHEN', 'kitchen'],
  ['bedroom', 'bedroom'],
  ['Bedroom', 'bedroom'],
  ['BEDROOM', 'bedroom'],
  ['master bedroom', 'master_bedroom'],
  ['Master Bedroom', 'master_bedroom'],
  ['MASTER BEDROOM', 'master_bedroom'],
  ['living room', 'living_room'],
  ['Living Room', 'living_room'],
  ['LIVING ROOM', 'living_room'],
  ['kids room', 'kids_room'],
  ['Kids Room', 'kids_room'],
  ['KIDS ROOM', 'kids_room'],
  ['children room', 'kids_room'],
  ['Children Room', 'kids_room'],
  ['garage', 'garage'],
  ['Garage', 'garage'],
  ['GARAGE', 'garage'],
  
  // Traditional Chinese to normalized key
  ['廚房', 'kitchen'],
  ['臥室', 'bedroom'],
  ['主臥室', 'master_bedroom'],
  ['客廳', 'living_room'],
  ['兒童房', 'kids_room'],
  ['小孩房', 'kids_room'],
  ['車庫', 'garage'],
  
  // Simplified Chinese to normalized key
  ['厨房', 'kitchen'],
  ['卧室', 'bedroom'],
  ['主卧室', 'master_bedroom'],
  ['客厅', 'living_room'],
  ['儿童房', 'kids_room'],
  ['小孩房', 'kids_room'],
  ['车库', 'garage'],
  
  // Japanese to normalized key
  ['キッチン', 'kitchen'],
  ['寝室', 'bedroom'],
  ['マスターベッドルーム', 'master_bedroom'],
  ['リビングルーム', 'living_room'],
  ['子供部屋', 'kids_room'],
  ['ガレージ', 'garage'],
])

export const roomTranslations = Object.fromEntries(roomTranslationsMap)

// Get normalized key for a room name
export function getNormalizedRoomKey(roomName: string): string {
  const trimmed = roomName.trim()
  return roomTranslations[trimmed] || trimmed.toLowerCase().replace(/\s+/g, '_')
}

// Get display name for a normalized key in a specific language
export function getRoomDisplayName(normalizedKey: string, language: string): string {
  const displayNames: Record<string, Record<string, string>> = {
    'kitchen': {
      'en': 'Kitchen',
      'zh-TW': '廚房',
      'zh': '厨房',
      'ja': 'キッチン'
    },
    'bedroom': {
      'en': 'Bedroom',
      'zh-TW': '臥室',
      'zh': '卧室',
      'ja': '寝室'
    },
    'master_bedroom': {
      'en': 'Master Bedroom',
      'zh-TW': '主臥室',
      'zh': '主卧室',
      'ja': 'マスターベッドルーム'
    },
    'living_room': {
      'en': 'Living Room',
      'zh-TW': '客廳',
      'zh': '客厅',
      'ja': 'リビングルーム'
    },
    'kids_room': {
      'en': 'Kids Room',
      'zh-TW': '兒童房',
      'zh': '儿童房',
      'ja': '子供部屋'
    },
    'garage': {
      'en': 'Garage',
      'zh-TW': '車庫',
      'zh': '车库',
      'ja': 'ガレージ'
    }
  }
  
  return displayNames[normalizedKey]?.[language] || normalizedKey
}
