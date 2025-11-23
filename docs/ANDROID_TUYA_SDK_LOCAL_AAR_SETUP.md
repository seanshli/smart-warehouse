# Android Tuya SDK 本地 AAR 文件设置指南

## 🔍 问题

如果 Maven 仓库中无法找到 `com.thingclips.smart:thingsmart:6.11.0`，可以使用本地 AAR 文件。

## 📦 步骤 1: 提取 AAR 文件

### 从 SDK 压缩包中提取

```bash
# 解压 SDK
cd /Users/seanli/smart-warehouse
mkdir -p /tmp/tuya-sdk-extract
tar -xzf Android_SDK-3/Android_SDK.tar.gz -C /tmp/tuya-sdk-extract

# 查找 AAR 文件
find /tmp/tuya-sdk-extract -name "*.aar" -o -name "*.jar"
```

### 复制到项目

```bash
# 创建 libs 目录（如果不存在）
mkdir -p android/app/libs

# 复制 AAR 文件
# 注意：需要找到正确的 AAR 文件名称
cp /tmp/tuya-sdk-extract/6.11.0/thingsmart_home_sdk/*.aar android/app/libs/
```

## 🔧 步骤 2: 更新 build.gradle

### 修改 `android/app/build.gradle`

```gradle
dependencies {
    // ... 其他依赖 ...
    
    // Tuya Android SDK - 使用本地 AAR
    // 首先尝试 Maven，如果失败则使用本地 AAR
    implementation fileTree(include: ['*.aar', '*.jar'], dir: 'libs')
    
    // 如果 Maven 可用，使用 Maven（注释掉本地 AAR）
    // api enforcedPlatform("com.thingclips.smart:thingsmart-BizBundlesBom:6.11.0")
    // implementation 'com.thingclips.smart:thingsmart:6.11.0'
    // implementation 'com.thingclips.smart:thingsmart-bizbundle-device_activator'
    
    // 如果使用本地 AAR，需要手动指定
    // implementation(name: 'thingsmart-6.11.0', ext: 'aar')
    // implementation(name: 'thingsmart-bizbundle-device_activator-6.11.0', ext: 'aar')
}
```

## 📝 步骤 3: 检查 AAR 文件结构

Tuya SDK 可能包含多个 AAR 文件：
- `thingsmart-*.aar` - 主 SDK
- `thingsmart-bizbundle-*.aar` - BizBundle
- 其他依赖 AAR 文件

## ⚠️ 注意事项

1. **版本匹配**：确保所有 AAR 文件版本一致（6.11.0）
2. **依赖顺序**：BizBundle 依赖主 SDK，需要先加载主 SDK
3. **文件命名**：AAR 文件名称需要与 `implementation(name: '...', ext: 'aar')` 中的名称匹配

## 🔄 备用方案：使用实际可用的 Maven 版本

如果 6.11.0 也不可用，可以尝试：

1. **检查 Tuya 文档**：查看实际可用的版本号
2. **使用最新稳定版**：例如 `5.11.3` 或其他可用版本
3. **联系 Tuya 支持**：获取正确的 Maven 仓库和版本信息

## 📚 参考

- [Tuya Android SDK 集成文档](https://developer.tuya.com/cn/docs/app-development/preparation/preparation?id=Ka69nt983bhh5)
- [Tuya Maven 仓库](https://maven-other.tuya.com/repository/maven-public/)

