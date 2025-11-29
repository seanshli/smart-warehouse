# Traditional Chinese as Default Language

**Date:** 2025-11-26  
**Status:** ✅ **COMPLETED**

---

## 📋 Changes Made

The default language has been changed from Simplified Chinese (zh) to Traditional Chinese (zh-TW) throughout the application.

---

## 🔧 Files Modified

### 1. `lib/language.ts`
- **Changed:** Language detection now defaults to `zh-TW` instead of `zh` for generic Chinese
- **Changed:** Reordered `SUPPORTED_LANGUAGES` to prioritize `zh-TW` before `zh`
- **Logic:** 
  - If browser language is `zh-CN` or `zh-SG` → returns `zh` (Simplified)
  - If browser language is `zh-TW`, `zh-HK`, or generic `zh` → returns `zh-TW` (Traditional)

### 2. `lib/speech-to-text.ts`
- **Changed:** Default parameter from `zh_cn` to `zh_tw`
- **Changed:** Language mapping now correctly maps `zh-TW` to `zh_tw` (was incorrectly mapping to `zh_cn`)
- **Changed:** `getIFLYTEKLanguageCode()` now defaults to `zh_tw` instead of `zh_cn`
- **Logic:**
  - `zh-TW` / `zh-HK` → `zh_tw`
  - `zh-CN` / `zh-SG` → `zh_cn`
  - Generic `zh` → `zh_tw` (Traditional Chinese)

### 3. `components/VoiceCommentRecorder.tsx`
- **Changed:** Default return value from `en-US` to `zh-TW`
- **Changed:** Generic `zh` now maps to `zh-TW` instead of `zh-CN`
- **Logic:**
  - `zh-TW` / `zh-HK` → `zh-TW`
  - `zh-CN` / `zh-SG` → `zh-CN`
  - Generic `zh` → `zh-TW` (Traditional Chinese)

### 4. Date Formatting Updates
- **`app/building/[id]/page.tsx`:** Changed `toLocaleDateString('zh-CN')` → `toLocaleDateString('zh-TW')`
- **`app/community/[id]/page.tsx`:** Changed `toLocaleDateString('zh-CN')` → `toLocaleDateString('zh-TW')` (2 instances)
- **`components/community/JoinRequestList.tsx`:** Changed `toLocaleString('zh-CN')` → `toLocaleString('zh-TW')`

---

## 🎯 Behavior Changes

### Language Detection
- **Before:** Generic `zh` → Simplified Chinese (`zh`)
- **After:** Generic `zh` → Traditional Chinese (`zh-TW`)

### Speech Recognition
- **Before:** Default was `zh_cn` (Simplified)
- **After:** Default is `zh_tw` (Traditional)

### Voice Synthesis
- **Before:** Generic `zh` → `zh-CN` (Simplified)
- **After:** Generic `zh` → `zh-TW` (Traditional)

### Date Formatting
- **Before:** All dates formatted with `zh-CN` locale
- **After:** All dates formatted with `zh-TW` locale

---

## 📝 Notes

1. **Simplified Chinese Still Supported:** Users can still select Simplified Chinese (`zh`) from language settings
2. **Browser Detection:** If browser language is explicitly `zh-CN` or `zh-SG`, it will still use Simplified Chinese
3. **User Preference:** Saved user language preferences take priority over browser detection
4. **iFLYTEK Integration:** Speech recognition and synthesis now correctly use `zh_tw` for Traditional Chinese

---

## ✅ Verification

To verify the changes:

1. **Language Detection:**
   - Clear browser localStorage
   - Set browser language to generic `zh`
   - App should default to `zh-TW` (Traditional Chinese)

2. **Date Formatting:**
   - Check community and building pages
   - Dates should display in Traditional Chinese format

3. **Speech Features:**
   - Test voice recording with language set to `zh-TW`
   - Should use `zh_tw` for iFLYTEK API

---

## 🔄 Migration Notes

- **Existing Users:** Users with saved language preferences will keep their current setting
- **New Users:** Will default to Traditional Chinese (`zh-TW`) if browser language is generic `zh`
- **No Database Migration Required:** Language preference is stored in localStorage and user profile

---

**Last Updated:** 2025-11-26  
**Commit:** `a64a5d0` - `feat: set Traditional Chinese (zh-TW) as default instead of Simplified Chinese`


