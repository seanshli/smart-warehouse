# Native Migration Plan (Web → iOS/Android)

This document scopes the work required to move Smart Warehouse from a Capacitor (WebView) app to a fully native iOS/Android experience while keeping the existing Next.js backend/admin portal.

---

## Overview
| Stage | Goal | Deliverables | Owner/Dependencies |
|-------|------|--------------|--------------------|
| 0. Prerequisites | Ensure all Tuya SDK credentials & toolchains are ready | ✅ `TUYA_*` env vars, Tuya SDK packages, Apple/Google developer accounts, native build machines | You (tuya access), DevOps |
| 1. Hybrid + Native Plugins | Keep Web UI, add Capacitor plugins for Tuya SDK + WiFi scanning | Capacitor plugin (iOS/Android), updated Podfile/Gradle deps, ProvisioningModal integration, docs | Engineering |
| 2. Mixed UI | Rewrite provisioning/control screens in native UI (SwiftUI/Compose) while other pages stay WebView | Native UI modules, shared auth/session bridge, navigation toggle | Engineering + Design |
| 3. Full Native Frontend | Replace remaining WebView with native screens; keep Next.js for admin + API | Complete native apps, shared API client, release automation | Engineering |

---

## Stage 0 – Prerequisites (✅)
1. **Environment variables**  
   - `TUYA_IOS_SDK_APP_KEY/SECRET`, `TUYA_ANDROID_SDK_APP_KEY/SECRET`, `TUYA_ANDROID_SDK_SHA256` added to `.env`.  
   - Documented in `docs/TUYA_SDK_SETUP.md`.
2. **SDK Packages**  
   - Tuya iOS & Android SDK ZIP + PDFs stored in repo (`iOS_SDK-2`, `Android_SDK-3`, `docs/...pdf`).
3. **Tooling**  
   - Xcode 15+, Cocoapods, Android Studio Giraffe+, Gradle 8, Java 17.  
   - Apple Developer ID + keystores already present (`smart-warehouse-release-key.jks`).

---

## Stage 1 – Hybrid App with Native Plugins
> **Objective:** keep current Next.js UI but unlock native capabilities (Tuya provisioning, Wi-Fi scanning, BLE, push, etc.) through Capacitor plugins.

### Tasks
1. **Capacitor Plugin: TuyaProvisioning**
   - Swift + Kotlin plugin to wrap Tuya SDK (ThingSmartActivatorKit / Tuya Android SDK).  
   - Methods: `initialize()`, `startProvisioning({mode, ssid, password, ...})`, `stopProvisioning()`, `getStatus()`, `linkDevice()`.
   - Emits events (progress, success, failure).
2. **Capacitor Plugin: NativeWifi**
   - iOS: leverage `NEHotspotConfigurationManager` / NEHotspotNetwork APIs (AP mode) — limited to user-specified SSID (Apple restrictions).  
   - Android: use `WifiManager` + `ScanResult` (requires `ACCESS_FINE_LOCATION`, `NEARBY_WIFI_DEVICES`, `ACCESS_WIFI_STATE`).
3. **Front-end integration**
   - Update `components/ProvisioningModal.tsx` to detect plugin availability (`Capacitor.getPlatform()`), call native methods, and fall back to `/api/provisioning` when on Web.
   - Persist Wi-Fi selections between web & native flows.
4. **Build configuration**
   - `ios/App/Podfile`: add Tuya pod repos + `ThingSmart*` pods.  
   - `android/app/build.gradle`: add Tuya SDK AARs, configure maven repo, enable multidex if needed.
5. **Documentation & automation**
   - Update `docs/TUYA_SDK_SETUP.md`, `MOBILE_APP_DISTRIBUTION_GUIDE.md` with pod install/gradle steps.  
   - Add `npm run cap:sync-tuya` script (runs `npx cap sync ios android && pod install`).

### Deliverables
- Fully working provisioning from native SDK (EZ/AP/BLE) launched via existing modal.
- Wi-Fi scanning on native builds (fallback message on Web).
- QA checklist + TestFlight / Internal App Sharing builds.

---

## Stage 2 – Mixed UI (Native Provisioning & Control Screens)
> **Objective:** gradually replace critical screens with native UI while still hosting the rest in WebView.

### Scope
1. **App Shell Navigation**
   - Integrate native bottom/tab navigation; embed WebView for “Dashboard/Items/Settings” while provisioning opens native stack.
2. **Provisioning Flow in Native UI**
   - SwiftUI / Jetpack Compose screens for Wi-Fi selection, Tuya/BLE steps, device summary.
3. **Device Control / Status**
   - Native UI components for frequently used controls (toggle, temp slider, scenes).
4. **Shared Auth & Session**
   - Use `CapacitorCookies` or `WKWebsiteDataStore` bridging so WebView + native screens share auth tokens.

### Deliverables
- Hybrid navigation (native + WebView).  
- Analytics to measure native usage vs WebView.  
- Regression tests for login/session persistence.

---

## Stage 3 – Full Native Application
> **Objective:** complete migration to native front-end; Next.js remains for Admin dashboard + APIs.

### Scope
1. **Native Implementations**
   - Dashboard, inventory management, household management, notifications, settings.  
   - Multi-language support via i18n resources.
2. **Shared API / SDK Layer**
   - Create Kotlin/Swift API client (Retrofit/Alamofire) generated from OpenAPI or manually maintained.
3. **Offline & Push**
   - Support background sync, push notifications via Tuya/FCM/APNs as required.
4. **Release Automation**
   - Fastlane lanes for build/test/deploy, Play/App Store metadata automation.

### Deliverables
- Feature parity native apps.  
- Decommission WebView wrapper (Capacitor).  
- Updated QA suite & monitoring (Crashlytics, AppCenter, etc.).

---

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Apple Wi-Fi scan restrictions | Cannot list all SSIDs | Use Tuya AP (device-provided scan) or manual SSID entry + saved list |
| Tuya SDK requires user login/home management | Provisioning blocked | Implement Tuya guest login or link existing Tuya account via OAuth |
| App size increase due to Tuya bundles | Large binary | Use `use_frameworks! :linkage => :static`, strip unused biz bundles |
| Android permissions (location) | User opt-out prevents scan | Provide inline rationale + fallback manual entry |
| Time-to-market | Scope large | Deliver in stages; Stage 1 already unlocks key value |

---

## Next Steps
1. ✅ **Complete Stage 0 (done)**  
2. ⚙️ **Kick off Stage 1 (current)**  
   - Implement Capacitor plugins & hook to Provisioning UI.  
3. 📅 Schedule Stage 2 discovery workshops (UI design, navigation).  
4. 📐 Stage 3 detailed estimates once Stage 2 patterns validated.

Let me know if you’d like Gantt-style timelines or resource estimates added. This doc will evolve as we transition through each stage. 

