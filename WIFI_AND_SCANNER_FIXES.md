# WiFi Auto-Fill and iOS Scanner Fixes

## Issues Fixed

### 1. ✅ WiFi SSID Auto-Fill Not Working

**Problem**: WiFi SSID was not being auto-filled for any provisioning (配網) devices.

**Root Causes**:
- iOS WiFi plugin requires location permission to get SSID (iOS 14+ restriction)
- Error handling was too silent - failures weren't being logged properly
- No fallback mechanism when native plugin fails

**Fixes Applied**:

1. **Enhanced Error Handling** (`components/mqtt/ProvisioningModal.tsx`):
   - Added comprehensive console logging to track WiFi plugin calls
   - Added try-catch blocks around WiFi plugin calls
   - Added fallback to localStorage when native plugin fails
   - Added delay before calling WiFi plugin to ensure modal is fully rendered

2. **iOS WiFi Plugin** (`ios/App/App/Plugins/WiFiPlugin.swift`):
   - Improved `getCurrentSSID()` to properly check location permission
   - Added SSID cleaning (removes quotes that iOS sometimes adds)
   - Better handling of iOS 14+ restrictions

**Testing**:
- Check browser console for WiFi plugin logs (should see `🔍 ProvisioningModal:` logs)
- Verify location permission is granted on iOS device
- Test with different vendors (Tuya, Midea, ESP)

---

### 2. ✅ iOS Barcode Scanner Camera Not Clickable

**Problem**: After selecting camera, the scanner preview wasn't interactive - couldn't tap/click on the camera view.

**Root Causes**:
- Preview layer might not have been properly set up for interaction
- Container view might have been blocking touches
- Cancel button might have been interfering with touch events

**Fixes Applied** (`ios/App/App/Plugins/NativeBarcodeScanner.swift`):

1. **Container View Setup**:
   - Added `isUserInteractionEnabled = true` to container view
   - Ensured preview layer frame updates properly
   - Added async frame update after view is added

2. **Button Interaction**:
   - Made cancel button explicitly interactive with `isUserInteractionEnabled = true`
   - Brought button to front with `bringSubviewToFront()`
   - Improved button styling (better contrast, larger touch target)

3. **Preview Layer**:
   - Ensured preview layer is properly inserted at index 0
   - Added frame update after container is added to view hierarchy
   - Set proper video gravity for aspect fill

**Testing**:
- Open barcode/QR scanner on iOS device
- Verify camera preview is visible and interactive
- Verify cancel button is clickable
- Test scanning QR codes and barcodes

---

## Files Modified

1. `components/mqtt/ProvisioningModal.tsx` - Enhanced WiFi auto-fill with better error handling
2. `ios/App/App/Plugins/WiFiPlugin.swift` - Improved SSID retrieval for iOS 14+
3. `ios/App/App/Plugins/NativeBarcodeScanner.swift` - Fixed camera preview interaction

---

## Next Steps

1. **Test WiFi Auto-Fill**:
   - Open provisioning modal for any device (Tuya, Midea, ESP)
   - Check browser console for logs
   - Verify SSID auto-fills (may require location permission on iOS)

2. **Test iOS Scanner**:
   - Build iOS app and install on device
   - Open barcode/QR scanner
   - Verify camera preview is visible and interactive
   - Test scanning functionality

3. **iOS Location Permission**:
   - If WiFi SSID still doesn't auto-fill, check that location permission is granted
   - Go to iOS Settings → Privacy → Location Services → Smart Warehouse
   - Ensure "When In Use" or "Always" is selected

---

## Known Limitations

- **iOS WiFi SSID**: Requires location permission on iOS 14+ due to Apple's privacy restrictions
- **iOS WiFi Scanning**: iOS cannot scan for available WiFi networks - can only get currently connected network
- **Android WiFi**: Should work without location permission (Android 10+)
