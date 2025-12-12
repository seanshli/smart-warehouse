# Native Android/iOS Chat Implementation

## Overview

All chat processes (text, audio, video) now use native Android/iOS capabilities via Capacitor's WebView and native APIs.

## Native Platform Support

### iOS
- **Camera**: Uses `AVFoundation` via Capacitor Camera plugin
- **Microphone**: Uses `AVAudioSession` (configured in AppDelegate.swift)
- **Permissions**: 
  - `NSCameraUsageDescription`: "Camera is used for video calls with front desk and other household members, and to scan barcodes and invoices."
  - `NSMicrophoneUsageDescription`: "Microphone is required for voice and video calls with front desk and other household members."

### Android
- **Camera**: Uses Android Camera API via WebView
- **Microphone**: Uses Android AudioRecord API via WebView
- **Permissions**:
  - `CAMERA`: For video calls
  - `RECORD_AUDIO`: For audio/video calls
  - `MODIFY_AUDIO_SETTINGS`: For audio routing
- **Features**: Camera and microphone declared as optional features

## Implementation Details

### WebRTC Native Integration

The WebRTC implementation (`lib/webrtc.ts`) now:

1. **Detects Native Platform**:
   ```typescript
   const isNative = Capacitor.isNativePlatform()
   ```

2. **Requests Permissions**:
   - Uses Capacitor Camera plugin to check/request camera permissions
   - Microphone permissions handled via WebRTC getUserMedia API

3. **Optimizes for Native**:
   - Lower video resolution on native (640x480 vs 1280x720)
   - Mono audio (better performance)
   - Frame rate optimization

4. **Error Handling**:
   - Platform-specific error messages
   - Permission denial handling
   - Device capability checks

### Key Files Modified

1. **lib/webrtc.ts**
   - Added Capacitor platform detection
   - Native permission handling
   - Platform-specific optimizations

2. **capacitor.config.ts**
   - Camera plugin configuration
   - Microphone permissions documented

3. **ios/App/App/Info.plist**
   - Updated camera/microphone usage descriptions
   - Clear permission explanations

4. **android/app/src/main/AndroidManifest.xml**
   - Added MODIFY_AUDIO_SETTINGS permission
   - Declared camera/microphone as optional features

5. **ios/App/App/AppDelegate.swift**
   - Already configured AVAudioSession for playAndRecord mode
   - Supports speaker output and mixing

## How It Works

### WebRTC on Native Platforms

Capacitor uses a WebView that fully supports WebRTC APIs:
- `navigator.mediaDevices.getUserMedia()` works natively
- Camera and microphone access via native APIs
- Audio routing handled by native audio session

### Permission Flow

1. **User initiates call** (video/audio)
2. **App checks permissions**:
   - iOS: Uses Capacitor Camera plugin
   - Android: Uses WebView permission system
3. **Requests permissions if needed**
4. **Starts media stream** via getUserMedia
5. **Establishes WebRTC connection**

### Performance Optimizations

- **Video**: 640x480 on native (vs 1280x720 on web)
- **Audio**: Mono channel (vs stereo on web)
- **Frame Rate**: 30fps optimized for mobile
- **Codec**: Uses device-optimized codecs

## Testing on Native Platforms

### iOS Testing

1. Build app in Xcode
2. Install on device (simulator doesn't support camera/mic)
3. Grant permissions when prompted
4. Test video call:
   - Front door → Front desk
   - Household → Household
5. Test audio call
6. Test text chat

### Android Testing

1. Build app in Android Studio
2. Install on device
3. Grant permissions when prompted
4. Test all communication features
5. Verify audio routing (speaker/earpiece)

## Deployment

### Changes Pushed to Git

All changes have been committed and pushed:
- WebRTC native integration
- Permission configurations
- Platform-specific optimizations
- Documentation

### Redeployment

After pushing to git:
1. **Vercel** will automatically redeploy the web app
2. **Native apps** need to be rebuilt:
   - iOS: Build in Xcode and submit to App Store
   - Android: Build in Android Studio and submit to Play Store

### No Native Rebuild Required For:

- WebRTC signaling changes
- API endpoint changes
- UI component changes
- Real-time messaging updates

These work immediately after Vercel deployment because the app loads from the remote server.

### Native Rebuild Required For:

- Permission changes (Info.plist, AndroidManifest.xml)
- Native plugin changes
- Capacitor configuration changes

## Troubleshooting

### Issue: Camera/Microphone Not Working

**Symptoms**: Permission denied or device not found

**Solutions**:
1. Check Info.plist (iOS) or AndroidManifest.xml (Android)
2. Verify permissions are granted in device settings
3. Test on physical device (not simulator)
4. Check console logs for permission errors

### Issue: Audio Not Routing Correctly

**Symptoms**: Audio plays through wrong speaker

**Solutions**:
1. Check AVAudioSession configuration (iOS)
2. Verify MODIFY_AUDIO_SETTINGS permission (Android)
3. Test speaker/earpiece switching
4. Check audio session category

### Issue: Video Quality Poor

**Symptoms**: Low resolution or frame drops

**Solutions**:
1. Check video constraints in webrtc.ts
2. Verify device capabilities
3. Reduce resolution if needed
4. Check network connection

## Best Practices

1. **Always test on physical devices** - Simulators don't support camera/mic
2. **Request permissions at the right time** - When user initiates call
3. **Handle permission denials gracefully** - Show helpful messages
4. **Optimize for mobile** - Lower resolution, mono audio
5. **Test audio routing** - Speaker vs earpiece
6. **Monitor performance** - Check frame rate and audio quality

## Future Enhancements

Potential improvements:
- Background audio support
- Picture-in-picture video
- Screen sharing
- Call recording
- Push notifications for calls
- Native call UI (instead of web UI)

All chat features now work natively on Android and iOS! 🎉
