# Native iOS/Android Migration Plan

## Executive Summary

This document outlines the strategy to migrate Smart Warehouse from **Capacitor hybrid** to **fully native** iOS and Android applications.

---

## Current State Analysis

### Current Architecture (Capacitor Hybrid)
```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Next.js)                         │
│                   smart-warehouse-five.vercel.app           │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ WebView loads
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
┌───────┴───────┐                           ┌───────┴───────┐
│   iOS App     │                           │  Android App  │
│  (Capacitor)  │                           │  (Capacitor)  │
│  + WebView    │                           │  + WebView    │
│  + Native     │                           │  + Native     │
│    Plugins    │                           │    Plugins    │
└───────────────┘                           └───────────────┘
```

### Existing Native Plugins (Already Implemented)

| Plugin | iOS (Swift) | Android (Kotlin/Java) | Function |
|--------|-------------|----------------------|----------|
| **TuyaProvisioningPlugin** | ✅ | ✅ | Tuya device provisioning |
| **MideaProvisioningPlugin** | ✅ | ✅ | Midea device provisioning |
| **WiFiPlugin** | ✅ | ✅ | WiFi scanning/connection |
| **NativeBarcodeScanner** | ✅ | ✅ | Native barcode scanning |
| **NativeChatPlugin** | ✅ | ✅ | Native chat UI (SwiftUI/Compose) |

### Current SDK Integrations

| SDK | iOS | Android | Purpose |
|-----|-----|---------|---------|
| **Tuya SDK** | ✅ Installed | ✅ Installed | IoT device control |
| **Midea SDK** | ✅ Installed | ✅ Installed | Midea device control |
| **iFLYTEK AIUI** | ✅ Installed | ⚠️ Partial | Voice AI assistant |

---

## Target Architecture (Fully Native)

```
┌─────────────────────────────────────────────────────────────┐
│                 Backend API (Vercel/Next.js)                │
│                   /api/* endpoints only                     │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ REST API calls
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
┌───────┴───────┐                           ┌───────┴───────┐
│   iOS App     │                           │  Android App  │
│   (SwiftUI)   │                           │ (Jetpack      │
│   Native UI   │                           │  Compose)     │
│   + SDKs      │                           │   Native UI   │
│   + MQTT      │                           │   + SDKs      │
└───────────────┘                           └───────────────┘
```

---

## Migration Phases

### Phase 1: API Layer Preparation (2-3 weeks)
**Goal**: Ensure all APIs are mobile-ready

#### Tasks:
1. **API Documentation**
   - Document all `/api/*` endpoints
   - Create OpenAPI/Swagger specification
   - Define request/response schemas

2. **API Enhancements**
   - Add mobile-specific endpoints if needed
   - Implement proper pagination
   - Add offline-friendly response formats
   - Ensure consistent error handling

3. **Authentication**
   - Implement JWT token refresh for native apps
   - Add device registration endpoint
   - Create push notification token endpoint

#### Deliverables:
- [ ] OpenAPI specification file
- [ ] API documentation website
- [ ] Mobile authentication flow

---

### Phase 2: iOS Native App (6-8 weeks)

#### Architecture: SwiftUI + Combine + Swift Concurrency

```
ios-native/
├── SmartWarehouse/
│   ├── App/
│   │   └── SmartWarehouseApp.swift
│   ├── Core/
│   │   ├── Network/
│   │   │   ├── APIClient.swift
│   │   │   ├── APIEndpoints.swift
│   │   │   └── AuthenticationManager.swift
│   │   ├── Storage/
│   │   │   ├── CoreDataManager.swift
│   │   │   └── KeychainManager.swift
│   │   └── MQTT/
│   │       └── MQTTClient.swift
│   ├── Features/
│   │   ├── Dashboard/
│   │   │   ├── DashboardView.swift
│   │   │   └── DashboardViewModel.swift
│   │   ├── Items/
│   │   │   ├── ItemListView.swift
│   │   │   ├── ItemDetailView.swift
│   │   │   ├── AddItemView.swift
│   │   │   └── ItemsViewModel.swift
│   │   ├── Rooms/
│   │   │   ├── RoomListView.swift
│   │   │   └── RoomsViewModel.swift
│   │   ├── Scanner/
│   │   │   ├── BarcodeScannerView.swift
│   │   │   └── ScannerViewModel.swift
│   │   ├── IoT/
│   │   │   ├── DeviceListView.swift
│   │   │   ├── DeviceControlView.swift
│   │   │   ├── ProvisioningView.swift
│   │   │   └── IoTViewModel.swift
│   │   ├── Chat/
│   │   │   ├── ChatListView.swift
│   │   │   ├── ChatView.swift
│   │   │   └── ChatViewModel.swift
│   │   ├── Settings/
│   │   │   ├── SettingsView.swift
│   │   │   └── LanguageSettingsView.swift
│   │   └── Auth/
│   │       ├── LoginView.swift
│   │       ├── SignupView.swift
│   │       └── AuthViewModel.swift
│   ├── Models/
│   │   ├── Item.swift
│   │   ├── Room.swift
│   │   ├── Category.swift
│   │   ├── IoTDevice.swift
│   │   └── User.swift
│   ├── Services/
│   │   ├── TuyaService.swift
│   │   ├── MideaService.swift
│   │   └── AIUIService.swift
│   ├── Localization/
│   │   ├── en.lproj/
│   │   ├── zh-Hant.lproj/
│   │   ├── zh-Hans.lproj/
│   │   └── ja.lproj/
│   └── Resources/
│       └── Assets.xcassets/
├── SmartWarehouseTests/
└── SmartWarehouseUITests/
```

#### Week-by-Week Plan:

**Week 1-2: Core Infrastructure**
- [ ] Project setup with SwiftUI
- [ ] API client with async/await
- [ ] Authentication flow (login, register, token refresh)
- [ ] Core Data setup for offline storage
- [ ] Keychain integration for secure storage

**Week 3-4: Main Features**
- [ ] Dashboard view
- [ ] Item list with search
- [ ] Item detail view
- [ ] Add/Edit item
- [ ] Barcode scanner (reuse existing native code)

**Week 5-6: IoT & Advanced Features**
- [ ] IoT device list
- [ ] Device control panel
- [ ] Tuya provisioning (reuse existing plugin)
- [ ] Midea provisioning (reuse existing plugin)
- [ ] MQTT client for real-time updates

**Week 7-8: Polish & Testing**
- [ ] Chat feature (enhance existing SwiftUI code)
- [ ] Settings & language selection
- [ ] Offline mode
- [ ] Push notifications
- [ ] UI/UX polish
- [ ] Testing & bug fixes

---

### Phase 3: Android Native App (6-8 weeks)

#### Architecture: Jetpack Compose + Kotlin Flow + Hilt

```
android-native/
├── app/
│   └── src/main/
│       ├── java/com/smartwarehouse/
│       │   ├── SmartWarehouseApp.kt
│       │   ├── di/
│       │   │   ├── NetworkModule.kt
│       │   │   ├── DatabaseModule.kt
│       │   │   └── RepositoryModule.kt
│       │   ├── data/
│       │   │   ├── remote/
│       │   │   │   ├── ApiService.kt
│       │   │   │   └── AuthInterceptor.kt
│       │   │   ├── local/
│       │   │   │   ├── AppDatabase.kt
│       │   │   │   └── ItemDao.kt
│       │   │   └── repository/
│       │   │       ├── ItemRepository.kt
│       │   │       └── IoTRepository.kt
│       │   ├── domain/
│       │   │   ├── model/
│       │   │   │   ├── Item.kt
│       │   │   │   ├── Room.kt
│       │   │   │   └── IoTDevice.kt
│       │   │   └── usecase/
│       │   │       ├── GetItemsUseCase.kt
│       │   │       └── ControlDeviceUseCase.kt
│       │   ├── ui/
│       │   │   ├── theme/
│       │   │   │   ├── Color.kt
│       │   │   │   ├── Type.kt
│       │   │   │   └── Theme.kt
│       │   │   ├── navigation/
│       │   │   │   └── NavGraph.kt
│       │   │   ├── dashboard/
│       │   │   │   ├── DashboardScreen.kt
│       │   │   │   └── DashboardViewModel.kt
│       │   │   ├── items/
│       │   │   │   ├── ItemListScreen.kt
│       │   │   │   ├── ItemDetailScreen.kt
│       │   │   │   └── ItemsViewModel.kt
│       │   │   ├── scanner/
│       │   │   │   └── ScannerScreen.kt
│       │   │   ├── iot/
│       │   │   │   ├── DeviceListScreen.kt
│       │   │   │   ├── DeviceControlScreen.kt
│       │   │   │   └── IoTViewModel.kt
│       │   │   ├── chat/
│       │   │   │   └── (enhance existing NativeChatScreen.kt)
│       │   │   └── auth/
│       │   │       ├── LoginScreen.kt
│       │   │       └── AuthViewModel.kt
│       │   └── services/
│       │       ├── TuyaService.kt
│       │       ├── MideaService.kt
│       │       └── MqttService.kt
│       └── res/
│           ├── values/
│           │   └── strings.xml
│           ├── values-zh-rTW/
│           │   └── strings.xml
│           ├── values-zh-rCN/
│           │   └── strings.xml
│           └── values-ja/
│               └── strings.xml
├── build.gradle.kts
└── gradle/
```

#### Week-by-Week Plan:

**Week 1-2: Core Infrastructure**
- [ ] Project setup with Compose
- [ ] Hilt dependency injection
- [ ] Retrofit API client
- [ ] Room database for offline storage
- [ ] DataStore for preferences

**Week 3-4: Main Features**
- [ ] Dashboard screen
- [ ] Item list with search
- [ ] Item detail screen
- [ ] Add/Edit item
- [ ] Barcode scanner (reuse existing native code)

**Week 5-6: IoT & Advanced Features**
- [ ] IoT device list
- [ ] Device control panel
- [ ] Tuya provisioning (reuse existing plugin)
- [ ] Midea provisioning (reuse existing plugin)
- [ ] MQTT client for real-time updates

**Week 7-8: Polish & Testing**
- [ ] Chat feature (enhance existing Compose code)
- [ ] Settings & language selection
- [ ] Offline mode
- [ ] Push notifications (FCM)
- [ ] UI/UX polish
- [ ] Testing & bug fixes

---

### Phase 4: Feature Parity & Optimization (2-3 weeks)

#### Tasks:
1. **Cross-Platform Consistency**
   - Ensure identical features on both platforms
   - Match UI/UX patterns appropriately per platform

2. **Performance Optimization**
   - Image caching
   - Network request optimization
   - Battery optimization for MQTT

3. **Offline Mode**
   - Local database sync
   - Conflict resolution
   - Queue offline actions

4. **Testing**
   - Unit tests (80%+ coverage)
   - UI tests
   - Integration tests
   - Beta testing program

---

## Code Reuse Strategy

### Existing Native Code to Reuse

| Component | iOS File | Android File | Action |
|-----------|----------|--------------|--------|
| Tuya Provisioning | `TuyaProvisioningPlugin.swift` | `TuyaProvisioningPlugin.java` | Extract & enhance |
| Midea Provisioning | `MideaProvisioningPlugin.swift` | `MideaProvisioningPlugin.java` | Extract & enhance |
| WiFi Scanner | `WiFiPlugin.swift` | `WiFiPlugin.java` | Extract & enhance |
| Barcode Scanner | `NativeBarcodeScanner.swift` | `NativeBarcodeScannerPlugin.java` | Extract & enhance |
| Chat UI | `NativeChatPlugin.swift` | `NativeChatScreen.kt` | Already native, enhance |

### Shared Logic Options

1. **Kotlin Multiplatform (KMM)** - Share business logic
   - Pros: Share 50-70% of code
   - Cons: Learning curve, tooling maturity

2. **API-First Approach** (Recommended)
   - Keep all business logic on server
   - Native apps are thin clients
   - Easier maintenance

---

## Language/Localization Plan

### Native Localization Files

**iOS (Localizable.strings)**
```
// en.lproj/Localizable.strings
"dashboard" = "Dashboard";
"items" = "Items";
"rooms" = "Rooms";

// zh-Hant.lproj/Localizable.strings
"dashboard" = "儀表板";
"items" = "物品";
"rooms" = "房間";
```

**Android (strings.xml)**
```xml
<!-- values/strings.xml -->
<resources>
    <string name="dashboard">Dashboard</string>
    <string name="items">Items</string>
    <string name="rooms">Rooms</string>
</resources>

<!-- values-zh-rTW/strings.xml -->
<resources>
    <string name="dashboard">儀表板</string>
    <string name="items">物品</string>
    <string name="rooms">房間</string>
</resources>
```

### Sync Strategy
- Generate native localization files from `lib/translations.ts`
- Create script to export translations to iOS/Android formats
- Keep single source of truth in TypeScript

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1**: API Preparation | 2-3 weeks | API docs, mobile endpoints |
| **Phase 2**: iOS Native | 6-8 weeks | Native iOS app |
| **Phase 3**: Android Native | 6-8 weeks | Native Android app |
| **Phase 4**: Polish | 2-3 weeks | Production-ready apps |
| **Total** | **12-18 weeks** | Both native apps |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Feature regression | Maintain Capacitor app until native apps reach parity |
| SDK compatibility | Test SDKs early in native environment |
| Development time | Prioritize core features, defer advanced features |
| Testing coverage | Automated testing from start |

---

## Next Steps

1. **Immediate**: 
   - Create OpenAPI specification for all APIs
   - Set up iOS native project structure
   - Set up Android native project structure

2. **Short-term**:
   - Implement authentication flow on both platforms
   - Create shared API client code
   - Extract existing native plugin code

3. **Medium-term**:
   - Implement core features
   - Test with existing SDKs
   - Beta release

---

## Appendix: Technology Stack

### iOS
- **UI**: SwiftUI
- **Networking**: URLSession + async/await
- **Local Storage**: Core Data, Keychain
- **State Management**: Combine, @Observable
- **MQTT**: CocoaMQTT
- **Dependency Injection**: Swift DI (manual or Resolver)

### Android
- **UI**: Jetpack Compose
- **Networking**: Retrofit + OkHttp
- **Local Storage**: Room, DataStore, EncryptedSharedPreferences
- **State Management**: Kotlin Flow, StateFlow
- **MQTT**: Eclipse Paho
- **Dependency Injection**: Hilt
