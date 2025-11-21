# Xcode 运行问题排查指南
## Xcode Run Issues Troubleshooting Guide

## 🔍 常见问题 / Common Issues

### 问题 1: 应用无法启动 / App Won't Launch

**症状**:
- 构建成功，但点击运行后应用立即崩溃
- 或者应用启动后立即关闭

**可能原因**:
1. 缺少必要的文件或资源
2. 网络连接问题
3. 签名/证书问题
4. 模拟器/设备问题

**解决方法**:

#### 步骤 1: 检查控制台错误
在 Xcode 中：
1. 打开控制台: `⇧⌘C` (Shift + Command + C)
2. 查看错误信息
3. 查找红色错误消息

#### 步骤 2: 清理并重新构建
```bash
# 在 Xcode 中
Product → Clean Build Folder (⇧⌘K)
Product → Build (⌘B)
```

#### 步骤 3: 重新同步
```bash
npm run build:production
npx cap sync ios
```

#### 步骤 4: 检查设备/模拟器
- 确保选择了正确的设备或模拟器
- 确保模拟器已启动
- 尝试重启模拟器

---

### 问题 2: 网络连接错误 / Network Connection Error

**症状**:
- 应用启动但无法加载内容
- 显示网络错误或空白页面

**可能原因**:
1. 无法连接到 Vercel 服务器
2. HTTPS 证书问题
3. 网络安全配置问题

**解决方法**:

#### 检查网络连接
```bash
# 在终端中测试
curl https://smart-warehouse-five.vercel.app
```

#### 检查 Info.plist
确保 `NSAppTransportSecurity` 配置正确：
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

#### 检查 Capacitor 配置
确保 `capacitor.config.json` 中的服务器 URL 正确：
```json
{
  "server": {
    "url": "https://smart-warehouse-five.vercel.app",
    "cleartext": false
  }
}
```

---

### 问题 3: 签名错误 / Signing Error

**症状**:
- 构建失败，显示签名错误
- "No signing certificate found"

**解决方法**:

#### 在 Xcode 中配置签名
1. 选择项目: 点击左侧项目名称
2. 选择 Target: "App"
3. 打开 "Signing & Capabilities" 标签
4. 选择 "Automatically manage signing"
5. 选择你的 Team
6. 如果仍有问题，尝试手动选择 Provisioning Profile

---

### 问题 4: 模拟器问题 / Simulator Issues

**症状**:
- 无法选择模拟器
- 模拟器启动失败

**解决方法**:

#### 重启模拟器
```bash
# 关闭所有模拟器
killall Simulator

# 重新打开 Xcode
```

#### 检查模拟器列表
在 Xcode 中：
1. 点击设备选择器（顶部工具栏）
2. 查看可用的模拟器
3. 如果列表为空，运行: `xcrun simctl list devices`

---

### 问题 5: 文件缺失 / Missing Files

**症状**:
- 构建成功但运行时崩溃
- 控制台显示 "file not found" 错误

**解决方法**:

#### 检查 public 目录
```bash
ls -la ios/App/App/public/
```

应该看到：
- `index.html`
- `_next/` 目录
- 其他静态文件

如果没有，运行：
```bash
npm run build:production
npx cap sync ios
```

---

## 🔧 完整诊断流程 / Complete Diagnostic Process

### 步骤 1: 运行诊断脚本
```bash
./scripts/diagnose-ios-issues.sh
```

### 步骤 2: 检查 Xcode 控制台
1. 在 Xcode 中打开控制台 (`⇧⌘C`)
2. 查看所有错误和警告
3. 特别关注红色错误消息

### 步骤 3: 检查设备日志
如果应用在真机上运行：
1. 连接设备到 Mac
2. 在 Xcode 中: Window → Devices and Simulators
3. 选择设备
4. 查看设备日志

### 步骤 4: 测试网络连接
在模拟器/设备上：
1. 打开 Safari
2. 访问: `https://smart-warehouse-five.vercel.app`
3. 确认可以访问

---

## 📋 检查清单 / Checklist

在报告问题前，请确认：

- [ ] 已运行 `npm run build:production`
- [ ] 已运行 `npx cap sync ios`
- [ ] 在 Xcode 中已清理构建 (`⇧⌘K`)
- [ ] 已选择正确的设备/模拟器
- [ ] 已检查 Xcode 控制台错误
- [ ] 已检查网络连接
- [ ] 已检查签名配置
- [ ] 已查看设备日志（如果使用真机）

---

## 🆘 获取帮助 / Getting Help

如果问题仍然存在，请提供以下信息：

1. **错误消息**: Xcode 控制台中的完整错误
2. **构建日志**: Xcode 中的构建输出
3. **设备信息**: iOS 版本、设备型号
4. **Xcode 版本**: Help → About Xcode
5. **诊断脚本输出**: `./scripts/diagnose-ios-issues.sh`

---

## 🎯 快速修复命令 / Quick Fix Commands

```bash
# 完整重置
npm run build:production
npx cap sync ios

# 在 Xcode 中
# Product → Clean Build Folder (⇧⌘K)
# Product → Build (⌘B)
# Product → Run (⌘R)
```

