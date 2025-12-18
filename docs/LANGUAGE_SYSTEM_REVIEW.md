# Language System Review & Standardization

## Executive Summary

This document reviews all language dependencies in the Smart Warehouse system and provides a plan to standardize on the "configured language" (user's preferred language setting).

---

## Current Language Sources

### 1. User Preference (Primary Source) ✅
```typescript
// Stored in User model
user.language // 'en' | 'zh-TW' | 'zh' | 'ja'
```

### 2. Browser Detection (Fallback)
```typescript
// lib/language.ts
navigator.languages || navigator.language
```

### 3. API Query Parameter
```typescript
// Some endpoints accept language parameter
searchParams.get('language')
```

### 4. Hardcoded Defaults ⚠️
```typescript
userLanguage || 'en' // Scattered throughout codebase
```

---

## Language Flow Analysis

### Current Flow (Inconsistent)
```
┌─────────────────┐
│  User Settings  │──→ user.language in DB
└─────────────────┘
        │
        ↓
┌─────────────────┐     ┌─────────────────┐
│  Frontend       │←───→│ LocalStorage    │
│  (React)        │     │ preferred-lang  │
└─────────────────┘     └─────────────────┘
        │
        ↓ (sometimes passed, sometimes not)
┌─────────────────┐
│  API Endpoints  │──→ Uses user.language OR default 'en'
└─────────────────┘
        │
        ↓
┌─────────────────┐
│  AI Services    │──→ Uses passed language OR default
└─────────────────┘
```

### Target Flow (Consistent)
```
┌─────────────────┐
│  User Settings  │──→ user.language in DB (Single Source of Truth)
└─────────────────┘
        │
        ↓ (sync on login)
┌─────────────────┐
│  Frontend       │──→ LanguageProvider context
│  (React)        │    (synced with user.language)
└─────────────────┘
        │
        ↓ (always pass current language)
┌─────────────────┐
│  API Endpoints  │──→ Gets from session.user.language
└─────────────────┘
        │
        ↓ (consistent language parameter)
┌─────────────────┐
│  AI Services    │──→ Uses passed userLanguage
└─────────────────┘
```

---

## Issues Found

### Issue 1: Hardcoded Default Language
**Files affected:**

| File | Line | Current Code | Issue |
|------|------|--------------|-------|
| `components/warehouse/SearchPage.tsx` | 77 | `userLanguage: 'en'` | Hardcoded default |
| `lib/speech-to-text.ts` | 114 | `language: string = 'zh_tw'` | Hardcoded to Chinese |
| `lib/aiui-agent.ts` | 205 | `const userLanguage = language \|\| 'zh'` | Default to Chinese |
| `app/api/ai/recognize/route.ts` | 40 | `userLanguage \|\| 'en'` | Fallback to English |
| Multiple API routes | Various | `user?.language \|\| 'en'` | Fallback pattern |

### Issue 2: Inconsistent Language Codes
**Different formats used:**

| Format | Used In | Example |
|--------|---------|---------|
| ISO 639-1 | Most places | `en`, `zh`, `ja` |
| BCP 47 | Some places | `zh-TW`, `zh-CN` |
| iFLYTEK format | Speech services | `zh_tw`, `en_us` |
| Internal format | Translations | `zhTW`, `zhCN` |

### Issue 3: Language Not Passed to All Services
**Services missing language parameter:**
- Some barcode scanning calls
- Some item recognition calls
- Chat message translations

---

## Standardization Plan

### Step 1: Define Language Codes Standard

```typescript
// lib/language.ts - UPDATED

export type LanguageCode = 'en' | 'zh-TW' | 'zh' | 'ja'

export const LANGUAGE_CONFIG: Record<LanguageCode, {
  code: LanguageCode
  name: string
  nativeName: string
  iflytekCode: string
  whisperCode: string
  aiPromptLanguage: string
}> = {
  'en': {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    iflytekCode: 'en_us',
    whisperCode: 'en',
    aiPromptLanguage: 'English',
  },
  'zh-TW': {
    code: 'zh-TW',
    name: 'Traditional Chinese',
    nativeName: '繁體中文',
    iflytekCode: 'zh_tw',
    whisperCode: 'zh',
    aiPromptLanguage: '繁體中文 (Traditional Chinese)',
  },
  'zh': {
    code: 'zh',
    name: 'Simplified Chinese',
    nativeName: '简体中文',
    iflytekCode: 'zh_cn',
    whisperCode: 'zh',
    aiPromptLanguage: '简体中文 (Simplified Chinese)',
  },
  'ja': {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    iflytekCode: 'ja_jp',
    whisperCode: 'ja',
    aiPromptLanguage: '日本語 (Japanese)',
  },
}

// Helper to get configured language code for different services
export function getServiceLanguageCode(
  userLanguage: LanguageCode, 
  service: 'iflytek' | 'whisper' | 'ai'
): string {
  const config = LANGUAGE_CONFIG[userLanguage] || LANGUAGE_CONFIG['en']
  switch (service) {
    case 'iflytek': return config.iflytekCode
    case 'whisper': return config.whisperCode
    case 'ai': return config.aiPromptLanguage
    default: return config.code
  }
}
```

### Step 2: Create Language Context Hook

```typescript
// lib/hooks/useConfiguredLanguage.ts - NEW

import { useLanguage } from '@/components/LanguageProvider'
import { LanguageCode, LANGUAGE_CONFIG, getServiceLanguageCode } from '@/lib/language'

export function useConfiguredLanguage() {
  const { language } = useLanguage()
  
  return {
    language: language as LanguageCode,
    config: LANGUAGE_CONFIG[language as LanguageCode] || LANGUAGE_CONFIG['en'],
    
    // Helper methods
    foriFLYTEK: () => getServiceLanguageCode(language as LanguageCode, 'iflytek'),
    forWhisper: () => getServiceLanguageCode(language as LanguageCode, 'whisper'),
    forAI: () => getServiceLanguageCode(language as LanguageCode, 'ai'),
  }
}
```

### Step 3: Update API Routes to Use Session Language

```typescript
// Example: app/api/ai/recognize/route.ts - UPDATED

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Always get language from authenticated user
  const userLanguage = (session.user as any).language || 'en'
  
  // Use language config for service-specific codes
  const config = LANGUAGE_CONFIG[userLanguage as LanguageCode]
  
  // ... rest of the code using config
}
```

### Step 4: Update Speech Services

```typescript
// lib/speech-to-text.ts - UPDATED

import { LanguageCode, getServiceLanguageCode } from './language'

export async function transcribeAudio(
  audioBase64: string,
  userLanguage: LanguageCode = 'en' // Now typed
): Promise<string> {
  const iflytekLang = getServiceLanguageCode(userLanguage, 'iflytek')
  const whisperLang = getServiceLanguageCode(userLanguage, 'whisper')
  
  // Try iFLYTEK first
  let transcript = await transcribeWithIFLYTEK(audioBase64, iflytekLang)
  
  // Fallback to Whisper
  if (!transcript) {
    transcript = await transcribeWithOpenAI(audioBase64, whisperLang)
  }
  
  return transcript
}
```

---

## Files to Update

### Priority 1: Core Language System
- [ ] `lib/language.ts` - Add LANGUAGE_CONFIG and helpers
- [ ] `components/LanguageProvider.tsx` - Ensure sync with user.language
- [ ] Create `lib/hooks/useConfiguredLanguage.ts`

### Priority 2: API Routes
- [ ] `app/api/ai/recognize/route.ts` - Use session language
- [ ] `app/api/warehouse/search/route.ts` - Use session language
- [ ] `app/api/warehouse/search/chatgpt/route.ts` - Use session language
- [ ] `app/api/warehouse/activities/route.ts` - Already uses user.language ✅
- [ ] `app/api/warehouse/rooms/route.ts` - Remove query param fallback
- [ ] `app/api/warehouse/categories/route.ts` - Remove query param fallback
- [ ] `app/api/warehouse/items/[id]/checkout/route.ts` - Use consistent language

### Priority 3: Services
- [ ] `lib/speech-to-text.ts` - Use LANGUAGE_CONFIG
- [ ] `lib/aiui-agent.ts` - Use LANGUAGE_CONFIG
- [ ] `lib/ai.ts` - Use LANGUAGE_CONFIG for prompts
- [ ] `lib/dynamic-translations.ts` - Consistent language handling

### Priority 4: Components
- [ ] `components/warehouse/SearchPage.tsx` - Get from context
- [ ] `components/warehouse/AddItemModal.tsx` - Get from context
- [ ] `components/warehouse/BarcodeScanner.tsx` - Get from context

---

## Migration Script

```typescript
// scripts/standardize-language-usage.ts

/**
 * This script identifies all hardcoded language defaults
 * and inconsistent language handling in the codebase
 */

const PATTERNS_TO_FIND = [
  /userLanguage\s*\|\|\s*['"]en['"]/g,
  /language\s*\|\|\s*['"]en['"]/g,
  /language:\s*['"]zh_tw['"]/g,
  /language\s*=\s*['"]en['"]/g,
  /\.language\s*\?\?\s*['"]en['"]/g,
]

const FILES_TO_CHECK = [
  'app/api/**/*.ts',
  'lib/**/*.ts',
  'components/**/*.tsx',
]

// Run: npx tsx scripts/standardize-language-usage.ts
```

---

## Native App Language Sync

### iOS Implementation
```swift
// LanguageManager.swift

class LanguageManager: ObservableObject {
    @Published var currentLanguage: String = "en"
    
    static let shared = LanguageManager()
    
    func syncWithServer(userId: String) async {
        // Fetch user's language preference from API
        let user = try await APIClient.shared.getUser(userId)
        await MainActor.run {
            self.currentLanguage = user.language ?? "en"
        }
    }
    
    func updateLanguage(_ language: String) async {
        // Update on server
        try await APIClient.shared.updateUserLanguage(language)
        await MainActor.run {
            self.currentLanguage = language
        }
    }
}
```

### Android Implementation
```kotlin
// LanguageManager.kt

@HiltViewModel
class LanguageViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val dataStore: DataStore<Preferences>
) : ViewModel() {
    
    private val _currentLanguage = MutableStateFlow("en")
    val currentLanguage: StateFlow<String> = _currentLanguage.asStateFlow()
    
    fun syncWithServer() {
        viewModelScope.launch {
            userRepository.getCurrentUser()?.language?.let {
                _currentLanguage.value = it
            }
        }
    }
    
    fun updateLanguage(language: String) {
        viewModelScope.launch {
            userRepository.updateLanguage(language)
            _currentLanguage.value = language
        }
    }
}
```

---

## Translation Export Script

```typescript
// scripts/export-translations.ts

import { translations } from '../lib/translations'
import * as fs from 'fs'

// Export for iOS
function exportForIOS() {
  for (const [langCode, trans] of Object.entries(translations)) {
    const iosLang = langCode === 'zh-TW' ? 'zh-Hant' : 
                    langCode === 'zh' ? 'zh-Hans' : langCode
    
    const content = Object.entries(trans)
      .filter(([key]) => typeof trans[key as keyof typeof trans] === 'string')
      .map(([key, value]) => `"${key}" = "${value}";`)
      .join('\n')
    
    fs.writeFileSync(
      `ios-native/SmartWarehouse/Localization/${iosLang}.lproj/Localizable.strings`,
      content
    )
  }
}

// Export for Android
function exportForAndroid() {
  for (const [langCode, trans] of Object.entries(translations)) {
    const androidLang = langCode === 'zh-TW' ? 'values-zh-rTW' :
                        langCode === 'zh' ? 'values-zh-rCN' :
                        langCode === 'ja' ? 'values-ja' : 'values'
    
    const entries = Object.entries(trans)
      .filter(([key]) => typeof trans[key as keyof typeof trans] === 'string')
      .map(([key, value]) => `    <string name="${key}">${escapeXml(value as string)}</string>`)
      .join('\n')
    
    const content = `<?xml version="1.0" encoding="utf-8"?>
<resources>
${entries}
</resources>`
    
    fs.writeFileSync(
      `android-native/app/src/main/res/${androidLang}/strings.xml`,
      content
    )
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
}

exportForIOS()
exportForAndroid()
console.log('Translations exported successfully!')
```

---

## Testing Checklist

### Language Consistency Tests
- [ ] User changes language in settings → All UI updates
- [ ] User changes language → API responses in correct language
- [ ] User changes language → AI recognition uses correct language
- [ ] User changes language → Speech recognition uses correct language
- [ ] New user registration → Default language applied correctly
- [ ] Guest user → Browser language detection works

### Cross-Platform Tests
- [ ] Web app language sync with user.language
- [ ] iOS app language sync with user.language
- [ ] Android app language sync with user.language
- [ ] Language change on one platform → Reflects on others after sync

---

## Summary

### Key Changes Required:
1. **Centralize language configuration** in `lib/language.ts`
2. **Always use session user's language** in API routes
3. **Create language hooks** for consistent frontend access
4. **Map language codes** for different services (iFLYTEK, Whisper, etc.)
5. **Export translations** to native localization files

### Benefits:
- Single source of truth for language
- Consistent experience across all features
- Easier to add new languages
- Native app compatibility

---

## Next Steps

1. **Immediate**: Update `lib/language.ts` with LANGUAGE_CONFIG
2. **Short-term**: Update all API routes to use session language
3. **Medium-term**: Create translation export scripts
4. **Long-term**: Implement language sync in native apps
