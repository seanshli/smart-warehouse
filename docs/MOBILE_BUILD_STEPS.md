# 移动端构建步骤
## Mobile Build Steps

**最后更新**: 2025-11-21

---

## ⚠️ 重要提示

**必须先运行 Capacitor 同步，然后再构建！**

如果不先同步，原生应用会使用旧的 Web 代码，新功能（如 Dashboard 导航改进）不会生效。

---

## 📱 iOS 构建步骤

### 1. 同步 Capacitor（必须）

```bash
# 设置 UTF-8 编码（避免 CocoaPods 错误）
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# 同步 Web 资源到 iOS 项目
npx cap sync ios
```

**这会：**
- 将最新的 Web 代码复制到 `ios/App/App/public/`
- 更新 Capacitor 配置
- 更新 iOS 插件

### 2. 打开 Xcode

```bash
# 方法 1: 使用 npm 脚本
npm run ios:production

# 方法 2: 直接打开
npx cap open ios
```

### 3. 在 Xcode 中构建

1. **清理旧构建**（可选但推荐）
   - Product → Clean Build Folder (⇧⌘K)

2. **选择目标设备**
   - 选择 "Any iOS Device" 或真实设备

3. **构建项目**
   - Product → Build (⌘B)

4. **创建 Archive**（用于分发）
   - Product → Archive
   - 等待 Archive 完成

5. **分发应用**
   - 在 Organizer 窗口点击 "Distribute App"
   - 选择 "App Store Connect"
   - 选择 "Upload"
   - 按照向导完成上传

---

## 🤖 Android 构建步骤

### 1. 同步 Capacitor（必须）

```bash
# 同步 Web 资源到 Android 项目
npx cap sync android
```

**这会：**
- 将最新的 Web 代码复制到 `android/app/src/main/assets/public/`
- 更新 Capacitor 配置
- 更新 Android 插件

### 2. 打开 Android Studio

```bash
npx cap open android
```

### 3. 在 Android Studio 中构建

1. **等待 Gradle 同步**
   - Android Studio 会自动同步 Gradle
   - 等待同步完成（底部状态栏显示 "Gradle sync finished"）

2. **清理旧构建**（可选但推荐）
   - Build → Clean Project

3. **构建项目**
   - Build → Rebuild Project

4. **生成签名 Bundle**（用于分发）
   - Build → Generate Signed Bundle/APK
   - 选择 "Android App Bundle (.aab)" 或 "APK"
   - 选择签名密钥
   - 选择 Release 构建类型
   - 点击 "Finish"

---

## 🔄 完整工作流程

### iOS

```bash
# 1. 同步（必须）
export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8 && npx cap sync ios

# 2. 打开 Xcode
npm run ios:production

# 3. 在 Xcode 中：
#    - Clean Build Folder (⇧⌘K)
#    - Build (⌘B)
#    - Archive (Product → Archive)
```

### Android

```bash
# 1. 同步（必须）
npx cap sync android

# 2. 打开 Android Studio
npx cap open android

# 3. 在 Android Studio 中：
#    - Clean Project (Build → Clean Project)
#    - Rebuild Project (Build → Rebuild Project)
#    - Generate Signed Bundle (Build → Generate Signed Bundle/APK)
```

---

## ❓ 常见问题

### Q: 我可以直接打开 Xcode/Android Studio 构建吗？

**A: 不可以！** 必须先运行 `npx cap sync`，否则：
- 原生应用会使用旧的 Web 代码
- 新功能不会生效
- 可能导致功能不一致

### Q: 什么时候需要同步？

**A: 每次更改以下内容后都需要同步：**
- Web 代码（React/Next.js 组件）
- Capacitor 配置（`capacitor.config.ts`）
- 添加或更新 Capacitor 插件
- 更改 Web 资源（图片、字体等）

### Q: 同步需要多长时间？

**A: 通常很快（几秒到几十秒）：**
- iOS: 5-10 秒（包括 pod install）
- Android: 3-5 秒

### Q: 如果忘记同步会怎样？

**A: 应用会使用旧的 Web 代码：**
- 新功能不会出现
- 可能看到旧的 UI
- 需要重新同步并重新构建

---

## ✅ 检查清单

### iOS

- [ ] 运行 `npx cap sync ios`
- [ ] 打开 Xcode
- [ ] 清理旧构建（可选）
- [ ] 构建项目
- [ ] 创建 Archive（用于分发）

### Android

- [ ] 运行 `npx cap sync android`
- [ ] 打开 Android Studio
- [ ] 等待 Gradle 同步完成
- [ ] 清理旧构建（可选）
- [ ] 构建项目
- [ ] 生成签名 Bundle（用于分发）

---

## 📝 总结

**必须顺序：**
1. ✅ 先同步 (`npx cap sync`)
2. ✅ 再打开 IDE
3. ✅ 最后构建

**不要跳过同步步骤！**

