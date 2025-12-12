# iOS Plugin Rebuild Guide

## Issue: Plugins Not Working After Code Changes

If you're seeing errors like:
- "WiFi plugin is not properly registered"
- "Failed to start camera scanner"
- "Barcode scanner plugin is not properly registered"

This means the native iOS plugins need to be rebuilt in Xcode.

## Quick Fix Steps

### 1. Sync Capacitor Plugins
```bash
cd /path/to/smart-warehouse
npx cap sync ios
```

### 2. Open Xcode Project
```bash
npx cap open ios
```

### 3. In Xcode:

#### a. Clean Build Folder
- Press `Cmd + Shift + K` (or Product → Clean Build Folder)
- Wait for cleaning to complete

#### b. Verify Plugins Are Included
1. In the Project Navigator (left sidebar), expand `App` → `App` → `Plugins`
2. Verify these files exist:
   - `WiFiPlugin.swift`
   - `WiFiPlugin.m`
   - `NativeBarcodeScanner.swift`
   - `NativeBarcodeScanner.m`

#### c. Check Build Phases
1. Select the `App` target in the Project Navigator
2. Go to "Build Phases" tab
3. Expand "Compile Sources"
4. Verify these files are listed:
   - `WiFiPlugin.swift`
   - `WiFiPlugin.m`
   - `NativeBarcodeScanner.swift`
   - `NativeBarcodeScanner.m`

#### d. Rebuild the App
- Press `Cmd + B` to build
- Fix any compilation errors if they appear
- Once build succeeds, run on device/simulator

### 4. If Plugins Are Missing from Build Phases:

1. Right-click on `Plugins` folder → "Add Files to App..."
2. Navigate to `ios/App/App/Plugins/`
3. Select:
   - `WiFiPlugin.swift`
   - `WiFiPlugin.m`
   - `NativeBarcodeScanner.swift`
   - `NativeBarcodeScanner.m`
4. Make sure "Copy items if needed" is checked
5. Select "Create groups" (not "Create folder references")
6. Click "Add"

### 5. Verify Plugin Registration

The plugins are registered via Objective-C macros in the `.m` files:

**WiFiPlugin.m:**
```objc
CAP_PLUGIN(WiFiPlugin, "WiFi",
           CAP_PLUGIN_METHOD(getCurrentSSID, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(scanNetworks, CAPPluginReturnPromise);
           // ... etc
)
```

**NativeBarcodeScanner.m:**
```objc
CAP_PLUGIN(NativeBarcodeScanner, "NativeBarcodeScanner",
           CAP_PLUGIN_METHOD(checkPermission, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startScan, CAPPluginReturnPromise);
           // ... etc
)
```

These registrations should be automatically discovered by Capacitor.

### 6. Test After Rebuild

1. Build and run the app on a physical iOS device (plugins may not work in simulator)
2. Test WiFi scanning:
   - Go to MQTT panel → Tuya provisioning
   - Try scanning WiFi networks
3. Test barcode scanning:
   - Go to Add Item → Scan Barcode
   - Try scanning a barcode/QR code

## Common Issues

### Issue: "Plugin not found" error
**Solution:** Make sure plugins are in the Build Phases → Compile Sources list

### Issue: Build errors about missing imports
**Solution:** 
1. Clean build folder (`Cmd + Shift + K`)
2. Close and reopen Xcode
3. Run `npx cap sync ios` again

### Issue: Plugins work in simulator but not on device
**Solution:** 
- Some plugins (especially WiFi scanning) require a physical device
- Make sure you're testing on a real iOS device, not simulator

### Issue: Camera permission not requested
**Solution:**
1. Check `Info.plist` has `NSCameraUsageDescription` key
2. Delete app from device and reinstall
3. When app launches, it should request camera permission

## Verification Checklist

- [ ] `npx cap sync ios` completed without errors
- [ ] Plugins are visible in Xcode Project Navigator
- [ ] Plugins are listed in Build Phases → Compile Sources
- [ ] Build succeeds without errors
- [ ] App runs on physical iOS device
- [ ] WiFi scanning works (requires location permission)
- [ ] Barcode scanning works (requires camera permission)

## Still Having Issues?

1. Check Xcode console for detailed error messages
2. Verify Capacitor version: `npx cap --version`
3. Try removing and re-adding plugins:
   ```bash
   # Remove plugins from Xcode project
   # Then re-add them following step 4 above
   ```
4. Check that `capacitor.config.ts` has correct plugin configuration
