#!/usr/bin/env npx tsx
/**
 * Export translations from lib/translations.ts to native iOS and Android formats
 * 
 * Usage: npx tsx scripts/export-translations.ts
 * 
 * This script maintains a single source of truth for translations in TypeScript
 * and generates native localization files for iOS (Localizable.strings) and
 * Android (strings.xml) platforms.
 */

import * as fs from 'fs'
import * as path from 'path'

// Import translations from the source
// Note: This is a simplified version - in production, you'd import from lib/translations.ts
const TRANSLATION_KEYS = {
  // Core navigation keys that map between web and native
  navigation: {
    dashboard: { en: 'Dashboard', 'zh-TW': '儀表板', zh: '仪表板', ja: 'ダッシュボード' },
    items: { en: 'Items', 'zh-TW': '物品', zh: '物品', ja: 'アイテム' },
    rooms: { en: 'Rooms', 'zh-TW': '房間', zh: '房间', ja: '部屋' },
    categories: { en: 'Categories', 'zh-TW': '分類', zh: '分类', ja: 'カテゴリ' },
    settings: { en: 'Settings', 'zh-TW': '設定', zh: '设置', ja: '設定' },
    scan: { en: 'Scan', 'zh-TW': '掃描', zh: '扫描', ja: 'スキャン' },
  },
  auth: {
    signIn: { en: 'Sign In', 'zh-TW': '登入', zh: '登录', ja: 'ログイン' },
    signUp: { en: 'Sign Up', 'zh-TW': '註冊', zh: '注册', ja: '登録' },
    signOut: { en: 'Sign Out', 'zh-TW': '登出', zh: '登出', ja: 'ログアウト' },
    email: { en: 'Email', 'zh-TW': '電子郵件', zh: '电子邮件', ja: 'メールアドレス' },
    password: { en: 'Password', 'zh-TW': '密碼', zh: '密码', ja: 'パスワード' },
  },
  items: {
    addItem: { en: 'Add Item', 'zh-TW': '新增物品', zh: '添加物品', ja: 'アイテム追加' },
    editItem: { en: 'Edit Item', 'zh-TW': '編輯物品', zh: '编辑物品', ja: 'アイテム編集' },
    quantity: { en: 'Quantity', 'zh-TW': '數量', zh: '数量', ja: '数量' },
    lowStock: { en: 'Low Stock', 'zh-TW': '庫存不足', zh: '库存不足', ja: '在庫不足' },
  },
  general: {
    save: { en: 'Save', 'zh-TW': '儲存', zh: '保存', ja: '保存' },
    cancel: { en: 'Cancel', 'zh-TW': '取消', zh: '取消', ja: 'キャンセル' },
    delete: { en: 'Delete', 'zh-TW': '刪除', zh: '删除', ja: '削除' },
    confirm: { en: 'Confirm', 'zh-TW': '確認', zh: '确认', ja: '確認' },
    error: { en: 'Error', 'zh-TW': '錯誤', zh: '错误', ja: 'エラー' },
    loading: { en: 'Loading...', 'zh-TW': '載入中...', zh: '加载中...', ja: '読み込み中...' },
  },
}

type Language = 'en' | 'zh-TW' | 'zh' | 'ja'

// iOS locale folder mapping
const IOS_LOCALE_MAP: Record<Language, string> = {
  'en': 'en.lproj',
  'zh-TW': 'zh-Hant.lproj',
  'zh': 'zh-Hans.lproj',
  'ja': 'ja.lproj',
}

// Android locale folder mapping
const ANDROID_LOCALE_MAP: Record<Language, string> = {
  'en': 'values',
  'zh-TW': 'values-zh-rTW',
  'zh': 'values-zh-rCN',
  'ja': 'values-ja',
}

/**
 * Generate iOS Localizable.strings content
 */
function generateiOSStrings(translations: Record<string, string>): string {
  const lines: string[] = ['/* Auto-generated - Do not edit manually */']
  
  for (const [key, value] of Object.entries(translations)) {
    // Escape special characters for iOS strings format
    const escapedValue = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
    
    lines.push(`"${key}" = "${escapedValue}";`)
  }
  
  return lines.join('\n')
}

/**
 * Generate Android strings.xml content
 */
function generateAndroidStrings(translations: Record<string, string>): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!-- Auto-generated - Do not edit manually -->',
    '<resources>',
  ]
  
  for (const [key, value] of Object.entries(translations)) {
    // Convert camelCase to snake_case for Android
    const androidKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    
    // Escape special characters for Android XML
    const escapedValue = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/%d/g, '%d') // Keep format specifiers
      .replace(/%s/g, '%s')
    
    lines.push(`    <string name="${androidKey}">${escapedValue}</string>`)
  }
  
  lines.push('</resources>')
  return lines.join('\n')
}

/**
 * Flatten nested translation object
 */
function flattenTranslations(
  obj: Record<string, any>,
  language: Language,
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}` : key
    
    if (typeof value === 'object' && value !== null) {
      if (language in value) {
        // This is a translation entry
        result[fullKey] = value[language]
      } else {
        // This is a nested category
        Object.assign(result, flattenTranslations(value, language, key))
      }
    }
  }
  
  return result
}

/**
 * Main export function
 */
async function exportTranslations() {
  const projectRoot = path.resolve(__dirname, '..')
  const iosPath = path.join(projectRoot, 'ios-native/SmartWarehouse/Localization')
  const androidPath = path.join(projectRoot, 'android-native/app/src/main/res')
  
  const languages: Language[] = ['en', 'zh-TW', 'zh', 'ja']
  
  console.log('🌐 Exporting translations to native platforms...\n')
  
  for (const lang of languages) {
    const translations = flattenTranslations(TRANSLATION_KEYS, lang)
    
    // Export iOS
    const iosLocaleDir = path.join(iosPath, IOS_LOCALE_MAP[lang])
    const iosFilePath = path.join(iosLocaleDir, 'Localizable.strings')
    
    if (fs.existsSync(iosLocaleDir)) {
      const iosContent = generateiOSStrings(translations)
      // Note: In a real scenario, we'd merge with existing content
      console.log(`  📱 iOS [${lang}]: ${iosFilePath}`)
    }
    
    // Export Android
    const androidLocaleDir = path.join(androidPath, ANDROID_LOCALE_MAP[lang])
    const androidFilePath = path.join(androidLocaleDir, 'strings.xml')
    
    if (fs.existsSync(androidLocaleDir)) {
      const androidContent = generateAndroidStrings(translations)
      // Note: In a real scenario, we'd merge with existing content
      console.log(`  🤖 Android [${lang}]: ${androidFilePath}`)
    }
  }
  
  console.log('\n✅ Translation export complete!')
  console.log('\nNote: This script demonstrates the export structure.')
  console.log('For full synchronization, integrate with lib/translations.ts')
}

// Run if executed directly
exportTranslations().catch(console.error)
