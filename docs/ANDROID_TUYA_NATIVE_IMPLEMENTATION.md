# Android Tuya 原生配网实现指南
## Android Tuya Native Provisioning Implementation Guide

**最后更新**: 2025-11-21  
**状态**: ⚠️ **待实现**

---

## 📊 当前状态 / Current Status

### ✅ 已完成 / Completed

1. **插件框架**: ✅ 已创建
   - 文件: `android/app/src/main/java/com/smartwarehouse/app/plugins/TuyaProvisioningPlugin.java`
   - 结构: 已定义所有必要方法
   - 注解: 已正确配置

2. **环境变量**: ✅ 已配置
   - `TUYA_ANDROID_SDK_APP_KEY`
   - `TUYA_ANDROID_SDK_APP_SECRET`
   - `TUYA_ANDROID_SDK_SHA256`

3. **API 端点**: ✅ 已创建
   - `/api/mqtt/tuya/sdk-config` - 获取 SDK 凭证

### ❌ 待完成 / Pending

1. **SDK 集成**: ❌ 未完成
2. **功能实现**: ❌ 所有方法都是占位符
3. **权限配置**: ⚠️ 部分完成

---

## 🚀 实现步骤 / Implementation Steps

### 步骤 1: 解压 Android SDK

**位置**: `Android_SDK-3/Android_SDK.tar.gz`

```bash
cd Android_SDK-3
tar -xzf Android_SDK.tar.gz
```

**预期结构**:
```
Android_SDK-3/
├── Android_SDK.tar.gz
├── security-algorithm.tar.gz
└── Android_SDK/
    ├── aar/              # AAR 文件
    ├── demo/             # 示例代码
    ├── libs/             # 库文件
    └── README.md         # 说明文档
```

---

### 步骤 2: 添加 SDK 依赖到 Gradle

**文件**: `android/app/build.gradle`

#### 2.1 添加 Maven 仓库

在 `android/build.gradle` 的 `allprojects.repositories` 中添加：

```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
        // Tuya Maven 仓库
        maven {
            url "https://maven-other.tuya.com/repository/maven-public/"
        }
        // 本地 AAR 文件
        flatDir {
            dirs 'libs'
        }
    }
}
```

#### 2.2 添加 SDK 依赖

在 `android/app/build.gradle` 的 `dependencies` 中添加：

```gradle
dependencies {
    // ... 现有依赖 ...
    
    // Tuya Android SDK
    implementation 'com.tuya.smart:tuyasmart:3.34.5'  // 根据实际版本调整
    // 或者使用本地 AAR
    // implementation(name: 'tuya-sdk-release', ext: 'aar')
    
    // 如果使用本地 AAR，需要将 AAR 文件复制到 android/app/libs/
}
```

#### 2.3 配置 ProGuard（可选）

在 `android/app/proguard-rules.pro` 中添加：

```proguard
# Tuya SDK ProGuard rules
-keep class com.tuya.** { *; }
-dontwarn com.tuya.**
```

---

### 步骤 3: 配置 Android 权限

**文件**: `android/app/src/main/AndroidManifest.xml`

添加以下权限：

```xml
<!-- WiFi 相关权限 -->
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- 蓝牙相关权限 -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" android:maxSdkVersion="30" />

<!-- 网络权限 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

**注意**: Android 6.0+ 需要动态请求位置权限才能扫描 WiFi。

---

### 步骤 4: 实现 TuyaProvisioningPlugin.java

**文件**: `android/app/src/main/java/com/smartwarehouse/app/plugins/TuyaProvisioningPlugin.java`

#### 4.1 导入必要的类

```java
package com.smartwarehouse.app.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Tuya SDK 导入（根据实际 SDK 版本调整）
import com.tuya.smart.android.user.api.ILoginCallback;
import com.tuya.smart.android.user.bean.User;
import com.tuya.smart.home.sdk.TuyaHomeSdk;
import com.tuya.smart.sdk.api.INeedLoginListener;
import com.tuya.smart.sdk.api.IResultCallback;
import com.tuya.smart.sdk.bean.DeviceBean;
import com.tuya.smart.sdk.enums.ActivatorModelEnum;
import com.tuya.smart.sdk.api.ITuyaActivator;
import com.tuya.smart.sdk.api.ITuyaActivatorGetToken;
import com.tuya.smart.sdk.bean.ActivatorTokenBean;
import com.tuya.smart.home.sdk.bean.HomeBean;
import com.tuya.smart.home.sdk.api.ITuyaHome;
import com.tuya.smart.home.sdk.callback.ITuyaHomeResultCallback;
import com.tuya.smart.home.sdk.callback.ITuyaGetHomeListCallback;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import java.util.List;
```

#### 4.2 实现 initialize() 方法

```java
@PluginMethod
public void initialize(PluginCall call) {
    try {
        String appKey = call.getString("appKey");
        String appSecret = call.getString("appSecret");
        
        if (appKey == null || appSecret == null) {
            call.reject("AppKey and AppSecret are required");
            return;
        }
        
        Context context = getContext();
        
        // 初始化 Tuya SDK
        TuyaHomeSdk.init(context, appKey, appSecret);
        
        // 设置登录监听器（如果需要）
        TuyaHomeSdk.getUserInstance().setOnNeedLoginListener(new INeedLoginListener() {
            @Override
            public void onNeedLogin(Context context) {
                // 处理需要登录的情况
                // 对于配网，通常不需要登录
            }
        });
        
        JSObject result = new JSObject();
        result.put("initialized", true);
        result.put("native", true);
        result.put("message", "Tuya SDK initialized successfully");
        call.resolve(result);
        
    } catch (Exception e) {
        call.reject("Failed to initialize Tuya SDK: " + e.getMessage());
    }
}
```

#### 4.3 实现 startProvisioning() 方法

```java
@PluginMethod
public void startProvisioning(PluginCall call) {
    try {
        String mode = call.getString("mode");
        if (mode == null) {
            call.reject("Provisioning mode is required");
            return;
        }
        
        String householdId = call.getString("householdId");
        String householdName = call.getString("householdName");
        
        // 确保 Home 存在
        ensureHomeExists(householdName, new HomeCallback() {
            @Override
            public void onSuccess(Long homeId) {
                // 根据模式启动配网
                switch (mode.toLowerCase()) {
                    case "wifi":
                    case "ez":
                        startEZMode(call, homeId);
                        break;
                    case "hotspot":
                    case "ap":
                        startAPMode(call, homeId);
                        break;
                    case "wifi/bt":
                        startWiFiBTMode(call, homeId);
                        break;
                    case "zigbee":
                        startZigbeeMode(call, homeId);
                        break;
                    case "bt":
                        startBTMode(call, homeId);
                        break;
                    case "manual":
                        handleManualMode(call, homeId);
                        break;
                    case "auto":
                        startEZMode(call, homeId); // 默认使用 EZ 模式
                        break;
                    default:
                        call.reject("Unsupported provisioning mode: " + mode);
                }
            }
            
            @Override
            public void onError(String error) {
                call.reject("Failed to create or access Tuya Home: " + error);
            }
        });
        
    } catch (Exception e) {
        call.reject("Failed to start provisioning: " + e.getMessage());
    }
}
```

#### 4.4 实现 EZ 模式

```java
private void startEZMode(PluginCall call, Long homeId) {
    try {
        String ssid = call.getString("ssid");
        String password = call.getString("password");
        
        if (ssid == null || password == null) {
            call.reject("SSID and password are required for EZ mode");
            return;
        }
        
        // 获取配网 Token
        TuyaHomeSdk.getActivatorInstance().getActivatorToken(homeId, new ITuyaActivatorGetToken() {
            @Override
            public void onSuccess(ActivatorTokenBean tokenBean) {
                String token = tokenBean.getToken();
                
                // 启动 EZ 模式配网
                ITuyaActivator activator = TuyaHomeSdk.getActivatorInstance().newActivator();
                activator.setActivatorModel(ActivatorModelEnum.TY_EZ);
                activator.setTimeOut(100); // 100 秒超时
                activator.setListener(new ITuyaActivatorListener() {
                    @Override
                    public void onError(String errorCode, String errorMsg) {
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("status", "failed");
                        result.put("error", errorMsg);
                        call.resolve(result);
                    }
                    
                    @Override
                    public void onActiveSuccess(DeviceBean deviceBean) {
                        JSObject result = new JSObject();
                        result.put("success", true);
                        result.put("status", "success");
                        result.put("deviceId", deviceBean.getId());
                        result.put("deviceName", deviceBean.getName());
                        result.put("householdId", call.getString("householdId"));
                        result.put("tuyaHomeId", homeId.toString());
                        call.resolve(result);
                    }
                    
                    @Override
                    public void onStep(String step, Object data) {
                        // 配网步骤更新
                    }
                });
                
                activator.start();
            }
            
            @Override
            public void onFailure(String errorCode, String errorMsg) {
                call.reject("Failed to get activator token: " + errorMsg);
            }
        });
        
    } catch (Exception e) {
        call.reject("Failed to start EZ mode: " + e.getMessage());
    }
}
```

#### 4.5 实现 Home 管理

```java
private interface HomeCallback {
    void onSuccess(Long homeId);
    void onError(String error);
}

private void ensureHomeExists(String householdName, HomeCallback callback) {
    // 获取现有 Home 列表
    TuyaHomeSdk.getHomeManagerInstance().queryHomeList(new ITuyaGetHomeListCallback() {
        @Override
        public void onSuccess(List<HomeBean> homeList) {
            // 查找匹配的 Home（根据名称）
            for (HomeBean home : homeList) {
                if (home.getName().equals(householdName)) {
                    callback.onSuccess(home.getHomeId());
                    return;
                }
            }
            
            // 如果没有找到，创建新的 Home
            if (householdName == null || householdName.isEmpty()) {
                householdName = "Smart Warehouse Home";
            }
            
            TuyaHomeSdk.getHomeManagerInstance().createHome(
                householdName,
                0, // 纬度
                0, // 经度
                new ITuyaHomeResultCallback() {
                    @Override
                    public void onSuccess(HomeBean homeBean) {
                        callback.onSuccess(homeBean.getHomeId());
                    }
                    
                    @Override
                    public void onError(String errorCode, String errorMsg) {
                        callback.onError(errorMsg);
                    }
                }
            );
        }
        
        @Override
        public void onError(String errorCode, String errorMsg) {
            callback.onError(errorMsg);
        }
    });
}
```

#### 4.6 实现 getStatus() 方法

```java
@PluginMethod
public void getStatus(PluginCall call) {
    // Tuya Android SDK 不提供状态查询 API
    // 配网状态通过回调实时返回
    JSObject result = new JSObject();
    result.put("success", true);
    result.put("status", "provisioning");
    result.put("message", "Status query not available on Android. Use callbacks instead.");
    call.resolve(result);
}
```

#### 4.7 实现 stopProvisioning() 方法

```java
@PluginMethod
public void stopProvisioning(PluginCall call) {
    try {
        // 停止配网
        ITuyaActivator activator = TuyaHomeSdk.getActivatorInstance().newActivator();
        activator.stop();
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "Provisioning stopped");
        call.resolve(result);
        
    } catch (Exception e) {
        call.reject("Failed to stop provisioning: " + e.getMessage());
    }
}
```

---

### 步骤 5: 更新 native-client.ts

**文件**: `lib/provisioning/native-client.ts`

更新 `canUseNativeTuyaProvisioning()` 以支持 Android：

```typescript
export const canUseNativeTuyaProvisioning = (): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false // Server-side rendering
    }
    
    // Check if Capacitor is available
    if (!Capacitor) {
      return false
    }
    
    // Check if we're on iOS or Android
    const platform = Capacitor.getPlatform()
    const isNative = platform === 'ios' || platform === 'android'
    
    // Also check isNativePlatform for additional verification
    const isNativePlatform = Capacitor?.isNativePlatform?.() ?? false
    
    // Return true for both iOS and Android (after Android plugin is implemented)
    return isNative && isNativePlatform
  } catch (error) {
    console.warn('Error checking native platform:', error)
    return false
  }
}
```

---

### 步骤 6: 配置 SHA256 签名

1. **获取 SHA256**:
   ```bash
   keytool -list -v -keystore android/app/your-release-key.keystore
   ```

2. **更新 Tuya 后台**:
   - 登录 [Tuya Developer Console](https://developer.tuya.com/)
   - 进入 **App SDK > App > 应用信息**
   - 更新 Android App 的 SHA256 签名

3. **环境变量**:
   - 确保 `TUYA_ANDROID_SDK_SHA256` 已设置

---

## 📋 实现检查清单 / Implementation Checklist

### SDK 集成
- [ ] 解压 Android SDK
- [ ] 添加 Maven 仓库
- [ ] 添加 SDK 依赖到 `build.gradle`
- [ ] 配置 ProGuard 规则（如果需要）

### 权限配置
- [ ] 添加 WiFi 权限到 `AndroidManifest.xml`
- [ ] 添加蓝牙权限到 `AndroidManifest.xml`
- [ ] 添加位置权限到 `AndroidManifest.xml`
- [ ] 实现动态权限请求（Android 6.0+）

### 功能实现
- [ ] 实现 `initialize()` 方法
- [ ] 实现 `startProvisioning()` 方法
- [ ] 实现 EZ 模式配网
- [ ] 实现 AP 模式配网
- [ ] 实现 WiFi/BT 模式配网
- [ ] 实现 Zigbee 模式配网
- [ ] 实现 BT 模式配网
- [ ] 实现 Manual 模式配网
- [ ] 实现 `getStatus()` 方法
- [ ] 实现 `stopProvisioning()` 方法
- [ ] 实现 Home 管理（创建/查找）

### 测试
- [ ] 测试 SDK 初始化
- [ ] 测试 EZ 模式配网
- [ ] 测试 AP 模式配网
- [ ] 测试 Home 创建和映射
- [ ] 测试错误处理

### 更新前端
- [ ] 更新 `canUseNativeTuyaProvisioning()` 支持 Android
- [ ] 测试 Android 设备上的配网流程

---

## 🔧 参考资源 / Reference Resources

### Tuya 官方文档
- [Tuya Android SDK 文档](https://developer.tuya.com/en/docs/app-development/android-sdk)
- [快速集成安卓 App SDK](快速集成安卓 App SDK_Smart App SDK_Smart App SDK.pdf)

### iOS 实现参考
- `ios/App/App/Plugins/TuyaProvisioningPlugin.swift` - iOS 实现参考

### 相关文件
- `Android_SDK-3/Android_SDK.tar.gz` - Tuya Android SDK
- `docs/TUYA_SDK_SETUP.md` - SDK 设置指南
- `docs/TUYA_CURRENT_STATUS.md` - 当前状态

---

## ⚠️ 注意事项 / Important Notes

### 1. SDK 版本
- 确保使用与 iOS SDK 兼容的 Android SDK 版本
- 检查 SDK 文档中的 API 变更

### 2. 权限处理
- Android 6.0+ 需要动态请求位置权限
- 蓝牙权限在 Android 12+ 有特殊要求

### 3. 线程安全
- Tuya SDK 回调可能不在主线程
- 使用 `Handler` 或 `runOnUiThread()` 更新 UI

### 4. 错误处理
- 实现完善的错误处理
- 提供友好的错误消息

### 5. 测试
- 在真实 Android 设备上测试
- 测试不同 Android 版本（5.0+）
- 测试不同配网模式

---

## 🎯 预计时间 / Estimated Time

- **SDK 集成**: 1-2 小时
- **功能实现**: 4-6 小时
- **测试和调试**: 2-4 小时
- **总计**: 7-12 小时

---

## ✅ 完成后

1. **更新版本号**
   - 增加 Android 版本号
   - 提交并推送更改

2. **更新文档**
   - 更新 `docs/TUYA_CURRENT_STATUS.md`
   - 创建测试报告

3. **测试验证**
   - 在真实设备上测试所有配网模式
   - 验证 Home 创建和映射

---

## 📝 总结

Android 原生 Tuya 配网需要：

1. ✅ **解压 SDK** - 从 `Android_SDK-3/Android_SDK.tar.gz`
2. ✅ **添加依赖** - 更新 `build.gradle`
3. ✅ **配置权限** - 更新 `AndroidManifest.xml`
4. ✅ **实现插件** - 完成 `TuyaProvisioningPlugin.java`
5. ✅ **更新前端** - 更新 `canUseNativeTuyaProvisioning()`
6. ✅ **测试验证** - 在真实设备上测试

完成后，Android 将拥有与 iOS 相同的原生配网能力！🚀

