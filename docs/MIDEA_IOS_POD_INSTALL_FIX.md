# Midea iOS Pod Install - Complete Fix Guide

**Date:** 2025-11-26  
**Issue:** `pod install` fails with missing dependencies

---

## Problems Fixed

### 1. Path Issue ✅
- **Error:** `[!] No podspec found for 'MSmartSDK' in '../../MideaSDK/...'`
- **Fix:** Changed path from `../../` to `../` in Podfile

### 2. Missing Dependencies ✅
- **Error:** `[!] Unable to find a specification for 'OEMLogger' depended upon by 'OEMBusiness/NetworkFramework'`
- **Fix:** Added required dependencies to Podfile:
  - `OEMLogger` (from `OEMPods_Source/OEMLogger`)
  - `DolphinRouter` (from `OEMPods_Source/Dolphinrouter`)

---

## Updated Podfile Configuration

The `midea_pods` function now includes:

```ruby
def midea_pods
  midea_framework_path = '../MideaSDK/OEMSDK/OEMPods_Framework'
  midea_source_path = '../MideaSDK/OEMSDK/OEMPods_Source'
  
  # Dependencies from OEMPods_Source (required by OEMBusiness)
  pod 'OEMLogger', :path => "#{midea_source_path}/OEMLogger"
  pod 'DolphinRouter', :path => "#{midea_source_path}/Dolphinrouter"
  
  # Main Midea SDK pods from OEMPods_Framework
  pod 'OEMFoundation/NetworkFramework', :path => midea_framework_path
  pod 'OEMBusiness/NetworkFramework', :path => midea_framework_path
  pod 'MSmartSDK', :path => midea_framework_path
end
```

---

## Installation Steps

### 1. Ensure You Have Latest Changes

```bash
cd /Users/seanli/smart-warehouse
git pull origin main
```

### 2. Navigate to iOS App Directory

```bash
cd ios/App
```

### 3. Clean Pod Cache (Optional but Recommended)

```bash
pod cache clean --all
rm -rf Pods Podfile.lock
```

### 4. Install Pods

```bash
pod install
```

If you still get errors, try:

```bash
pod install --repo-update
```

---

## Expected Dependencies

After successful installation, you should see:

### From CocoaPods Repo:
- `FMDB` (required by OEMBusiness)
- `MJExtension` (required by DolphinRouter)
- Other standard dependencies

### From Local Midea SDK:
- `OEMLogger` (from `OEMPods_Source`)
- `DolphinRouter` (from `OEMPods_Source`)
- `OEMFoundation/NetworkFramework` (from `OEMPods_Framework`)
- `OEMBusiness/NetworkFramework` (from `OEMPods_Framework`)
- `MSmartSDK` (from `OEMPods_Framework`)

---

## Troubleshooting

### If `pod install` Still Fails:

1. **Check Current Directory:**
   ```bash
   pwd
   # Should be: /Users/seanli/smart-warehouse/ios/App
   ```

2. **Verify Podfile Path:**
   ```bash
   cat Podfile | grep midea_sdk_path
   # Should show: midea_sdk_path = '../MideaSDK/OEMSDK/OEMPods_Framework'
   ```

3. **Verify SDK Files Exist:**
   ```bash
   ls -la ../MideaSDK/OEMSDK/OEMPods_Framework/*.podspec
   ls -la ../MideaSDK/OEMSDK/OEMPods_Source/OEMLogger/OEMLogger.podspec
   ls -la ../MideaSDK/OEMSDK/OEMPods_Source/Dolphinrouter/DolphinRouter.podspec
   ```

4. **Update CocoaPods Repo:**
   ```bash
   pod repo update
   pod install
   ```

5. **Check for Other Missing Dependencies:**
   - If you see errors about `OEMTheme` or `OEMEnvirement`, uncomment them in Podfile
   - If you see errors about `FMDB` or `MJExtension`, they should install automatically from CocoaPods

---

## File Structure Reference

```
smart-warehouse/
├── ios/
│   ├── App/
│   │   └── Podfile          ← Updated with dependencies
│   └── MideaSDK/
│       └── OEMSDK/
│           ├── OEMPods_Framework/  ← Main SDK pods
│           │   ├── MSmartSDK.podspec
│           │   ├── OEMFoundation.podspec
│           │   └── OEMBusiness.podspec
│           └── OEMPods_Source/     ← Dependency pods
│               ├── OEMLogger/
│               │   └── OEMLogger.podspec
│               └── Dolphinrouter/
│                   └── DolphinRouter.podspec
```

---

## Status

✅ **Path Issue:** Fixed  
✅ **Dependencies:** Added  
✅ **Podfile:** Updated  

**Next Step:** Run `pod install` from `ios/App/` directory

---

**Last Updated:** 2025-11-26  
**Commits:**
- `7944830` - Fixed path (../ instead of ../../)
- `933e625` - Added dependencies (OEMLogger, DolphinRouter)

