# Tuya SDK Assets Reference

This repository now tracks the official Tuya Smart App SDK packages and quick-start PDFs to ensure we have the exact binaries that correspond to our AppKey/AppSecret.

| File/Folder | Description | Notes |
|-------------|-------------|-------|
| `iOS_SDK-2/ios_core_sdk.tar.gz` | Tuya iOS core SDK bundle (ThingSmart* frameworks) | Extracted from the Tuya IoT console when generating iOS SDK. Required by the Capacitor iOS plugin Podfile. |
| `iOS_SDK-2/Podfile` | Sample Podfile provided by Tuya | Use as reference when wiring Tuya pods into our Capacitor project. |
| `Android_SDK-3/Android_SDK.tar.gz` | Tuya Android SDK bundle (AARs + libs) | Will be unpacked into `android/app/libs` during Stage 1 integration. |
| `Android_SDK-3/security-algorithm.tar.gz` | Tuya security module required by the Android SDK | Some modules must be placed under `app/src/main/jniLibs`. |
| `快速集成_Smart App SDK_Smart App SDK.pdf` | Tuya Smart App SDK quick-start (Chinese) | Contains instructions for initializing SDK, enabling biz bundles, etc. |
| `快速集成安卓 App SDK_Smart App SDK_Smart App SDK.pdf` | Tuya Android SDK integration guide | Detailed steps for Android Studio/Gradle setup. |

These files are referenced by:
- `docs/TUYA_SDK_SETUP.md`
- `docs/NATIVE_MIGRATION_PLAN.md`

> ⚠️ **Do not modify the contents of the SDK archives.** Always download updated versions from the Tuya console if SDK versions change and commit the new archives with clear version notes.

