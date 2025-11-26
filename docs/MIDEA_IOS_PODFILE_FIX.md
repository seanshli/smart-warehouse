# Midea iOS Podfile Path Fix

**Date:** 2025-11-26  
**Issue:** `pod install` failed with error: `[!] No podspec found for 'MSmartSDK' in '../../MideaSDK/OEMSDK/OEMPods_Framework'`

---

## Problem

The Podfile was using an incorrect relative path:
```ruby
pod 'MSmartSDK', :path => '../../MideaSDK/OEMSDK/OEMPods_Framework'
```

This path goes **two levels up** from `ios/App/`:
- `ios/App/` → `../` → `ios/` → `../` → root → `MideaSDK/...` ❌

But the actual structure is:
- `ios/App/` → `../` → `ios/` → `MideaSDK/...` ✅

---

## Solution

Changed the path to go **one level up**:
```ruby
midea_sdk_path = '../MideaSDK/OEMSDK/OEMPods_Framework'
pod 'OEMFoundation/NetworkFramework', :path => midea_sdk_path
pod 'OEMBusiness/NetworkFramework', :path => midea_sdk_path
pod 'MSmartSDK', :path => midea_sdk_path
```

---

## Verification

To verify the fix works:

```bash
cd ios/App
pod install
```

Expected result: Pods should install successfully without path errors.

---

## File Structure

```
smart-warehouse/
├── ios/
│   ├── App/
│   │   └── Podfile          ← Podfile location
│   └── MideaSDK/
│       └── OEMSDK/
│           └── OEMPods_Framework/  ← SDK location
│               ├── MSmartSDK.podspec
│               ├── OEMFoundation.podspec
│               ├── OEMBusiness.podspec
│               └── *.framework
```

From `ios/App/Podfile`, the correct relative path is:
- `../MideaSDK/OEMSDK/OEMPods_Framework` ✅

---

**Status:** ✅ Fixed  
**Commit:** `7944830` - `fix(ios): correct Midea SDK path in Podfile (../ instead of ../../)`

