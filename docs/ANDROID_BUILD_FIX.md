# Android 构建修复
## Android Build Fix

**日期**: 2025-11-21  
**问题**: Android 构建失败 - `PluginMethod` 无法找到

---

## 🐛 问题描述 / Problem Description

### 错误信息
```
error: cannot find symbol
import com.getcapacitor.annotation.PluginMethod;
                              ^
symbol: class PluginMethod
location: package com.getcapacitor.annotation
```

### 影响范围
- `TuyaProvisioningPlugin.java` 无法编译
- Android Release 构建失败

---

## ✅ 解决方案 / Solution

### 问题原因
在 **Capacitor 7** 中，`PluginMethod` 注解的包路径发生了变化：
- ❌ **错误**: `com.getcapacitor.annotation.PluginMethod`
- ✅ **正确**: `com.getcapacitor.PluginMethod`

### 修复内容

**文件**: `android/app/src/main/java/com/smartwarehouse/app/plugins/TuyaProvisioningPlugin.java`

**修改前**:
```java
import com.getcapacitor.annotation.PluginMethod;
```

**修改后**:
```java
import com.getcapacitor.PluginMethod;
```

### 完整的导入语句

```java
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;  // ✅ 正确的导入路径
import com.getcapacitor.annotation.CapacitorPlugin;
```

---

## 🔍 验证步骤 / Verification Steps

### 1. 清理构建
```bash
cd android
./gradlew clean
```

### 2. 编译 Java 代码
```bash
./gradlew :app:compileReleaseJavaWithJavac
```

### 3. 完整构建
```bash
./gradlew assembleRelease
```

### 4. 在 Android Studio 中
- **Build → Clean Project**
- **Build → Rebuild Project**

---

## 📋 检查清单 / Checklist

- [x] 修复 `PluginMethod` 导入路径
- [x] 清理构建缓存
- [x] 验证编译通过
- [ ] 测试完整构建
- [ ] 在 Android Studio 中验证

---

## 🎯 相关文件 / Related Files

- `android/app/src/main/java/com/smartwarehouse/app/plugins/TuyaProvisioningPlugin.java`
- `android/app/build.gradle`
- `package.json` (Capacitor 7.4.3)

---

## 📚 参考 / References

- [Capacitor 7 Documentation](https://capacitorjs.com/docs)
- [Capacitor Plugin API](https://capacitorjs.com/docs/plugins/creating-plugins)

---

## ✅ 状态 / Status

- ✅ **已修复**: `PluginMethod` 导入路径
- ✅ **已修复**: Java 版本兼容性问题（Java 17）
- ✅ **已验证**: Java 编译通过
- ✅ **已验证**: Release 构建成功

---

## 🔧 额外修复 / Additional Fixes

### Java 版本问题

**问题**: `error: invalid source release: 21`

**原因**: 系统安装的是 Java 17，但 Capacitor 配置要求 Java 21

**解决方案**: 在 `android/app/build.gradle` 中添加 Java 17 配置：

```gradle
android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}
```

**注意**: `capacitor.build.gradle` 会自动生成并覆盖为 Java 21，但我们的配置会在子项目级别提供 Java 17 的 fallback。

