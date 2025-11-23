# iOS 和 Android 构建准备检查清单

## ✅ 构建准备状态

### 📦 代码状态
- ✅ **Prisma Client**: 已生成
- ✅ **TypeScript 编译**: 通过
- ✅ **Next.js 构建**: 成功
- ✅ **所有文件**: 已暂存（待提交）

### 📱 iOS 构建配置

#### 版本信息
- **Marketing Version**: `1.0.27`
- **Build Version**: `36`
- **Bundle ID**: `com.smartwarehouse.app`

#### 依赖配置
- ✅ **Podfile**: 已配置 Tuya SDK pods
  - `ThingSmartCryption` (本地路径)
  - `ThingSmartActivatorBizBundle` (~> 6.11.0)
  - `ThingSmartHomeKit` (~> 6.11.0)
- ✅ **Info.plist**: 所有必要权限已添加
  - 网络权限
  - 蓝牙权限
  - 位置权限（WiFi 扫描）
  - Bonjour 服务

#### 原生插件
- ✅ **TuyaProvisioningPlugin.swift**: 完整实现
  - 所有配网模式（EZ, AP, WiFi/BT, Zigbee, BT, Manual）
  - 用户登录/登出
  - Tuya Home 管理
  - 成员管理

### 🤖 Android 构建配置

#### 版本信息
- **Version Name**: `1.0.27`
- **Version Code**: `27`
- **Package Name**: `com.smartwarehouse.app`

#### 依赖配置
- ✅ **build.gradle**: Java 17 配置
- ✅ **Maven 仓库**: Tuya Maven 仓库已添加
- ✅ **AndroidManifest.xml**: 所有必要权限已添加
  - 网络权限
  - 蓝牙权限
  - WiFi 权限
  - 位置权限

#### 原生插件
- ⚠️ **TuyaProvisioningPlugin.java**: 框架已就绪
  - 所有方法框架已创建
  - 待集成 Tuya Android SDK

### 🔧 构建脚本

#### Next.js 构建
- ✅ **build:production**: 成功
  - 使用 standalone 模式
  - 动态路由支持客户端渲染
  - API routes 在服务器端运行

#### Capacitor 同步
- ✅ **cap:copy**: 复制 web 资源到原生项目
- ✅ **cap:sync**: 同步插件和配置

## 📋 构建步骤

### iOS 构建

1. **同步 Capacitor**
   ```bash
   npm run build:production
   npx cap sync ios
   ```

2. **安装 CocoaPods 依赖**
   ```bash
   cd ios/App
   pod install
   ```

3. **打开 Xcode**
   ```bash
   npx cap open ios
   ```

4. **在 Xcode 中构建**
   - 选择目标设备或模拟器
   - Product → Build (⌘+B)
   - 检查是否有警告或错误

5. **Archive（用于分发）**
   - Product → Archive
   - 等待归档完成
   - 在 Organizer 中分发

### Android 构建

1. **同步 Capacitor**
   ```bash
   npm run build:production
   npx cap sync android
   ```

2. **打开 Android Studio**
   ```bash
   npx cap open android
   ```

3. **在 Android Studio 中构建**
   - File → Sync Project with Gradle Files
   - Build → Make Project
   - 检查是否有错误

4. **生成 APK/AAB**
   - Build → Generate Signed Bundle / APK
   - 选择 Android App Bundle (.aab)
   - 配置签名密钥
   - 生成并上传到 Play Store

## ⚠️ 注意事项

### iOS
1. **CocoaPods 警告**: `[CP] Copy XCFrameworks` 警告是正常的，已在 Podfile 中处理
2. **Tuya SDK**: 确保 `iOS_SDK-2` 目录存在且包含 SDK 文件
3. **证书**: 确保 Apple Developer 证书已配置

### Android
1. **Tuya SDK**: 需要解压 `Android_SDK-3/Android_SDK.tar.gz` 并集成
2. **Java 版本**: 确保使用 Java 17 或更高版本
3. **签名**: 确保签名密钥已配置

## 🔍 验证清单

### 构建前检查
- [ ] Git 状态干净（所有更改已提交）
- [ ] Prisma Client 已生成
- [ ] TypeScript 编译无错误
- [ ] Next.js 构建成功
- [ ] 环境变量已配置

### iOS 构建检查
- [ ] CocoaPods 依赖已安装
- [ ] Xcode 项目可以打开
- [ ] 没有编译错误
- [ ] 所有原生插件已注册
- [ ] Info.plist 权限已配置

### Android 构建检查
- [ ] Gradle 同步成功
- [ ] Android Studio 项目可以打开
- [ ] 没有编译错误
- [ ] 所有原生插件已注册
- [ ] AndroidManifest.xml 权限已配置

## 🚀 快速构建命令

```bash
# 完整构建流程
npm run build:production
npx cap sync ios
npx cap sync android

# iOS
cd ios/App && pod install && cd ../..
npx cap open ios

# Android
npx cap open android
```

## 📝 待完成事项

1. **Android Tuya SDK 集成**
   - 解压 `Android_SDK-3/Android_SDK.tar.gz`
   - 集成到 Android 项目
   - 实现所有配网方法

2. **Git 提交**
   - 提交所有更改
   - 推送到远程仓库

3. **数据库迁移**
   - 在 Supabase 运行 `scripts/migrate-automation-scenes-supabase.sql`
   - 验证迁移成功

