# iOS 构建问题修复总结
## iOS Build Issue Fix Summary

## ✅ 已修复的问题 / Fixed Issues

### 1. 导入路径错误
**问题**: `app/items/page.tsx` 中使用了旧的组件导入路径
- ❌ `@/components/MoveItemModal`
- ❌ `@/components/CheckoutModal`
- ❌ `@/components/QuantityAdjustModal`

**修复**: 更新为新的 warehouse 模块路径
- ✅ `@/components/warehouse/MoveItemModal`
- ✅ `@/components/warehouse/CheckoutModal`
- ✅ `@/components/warehouse/QuantityAdjustModal`

### 2. Next.js 静态导出问题
**问题**: `next export` 命令已弃用，且静态导出不支持 API routes

**修复**: 
- 创建了 `scripts/build-for-capacitor.js` 脚本
- 在构建时临时移动 API routes 目录
- 构建完成后恢复 API routes
- 更新了 `package.json` 中的构建脚本

### 3. 构建配置
**修复**: 更新了 `next.config.js` 以支持 Capacitor 构建

---

## 🚀 现在可以继续 iOS 同步

### 步骤 1: 构建（已完成 ✅）
```bash
npm run build:production
```

### 步骤 2: 同步到 iOS
```bash
npx cap sync ios
```

### 步骤 3: 打开 Xcode
```bash
npx cap open ios
```

或者一键完成：
```bash
npm run ios:production
```

---

## 📝 技术说明 / Technical Notes

### Capacitor 构建策略

1. **静态导出页面**: 只导出前端页面（HTML/JS/CSS）
2. **API 在服务器运行**: 所有 API routes 在 Vercel 上运行
3. **Capacitor 配置**: 使用 `server.url` 指向 Vercel 服务器

这意味着：
- ✅ 前端页面打包在 iOS/Android 应用中
- ✅ API 调用通过 HTTPS 发送到 Vercel
- ✅ 支持离线查看（已加载的页面）
- ✅ API 功能正常工作（通过服务器）

### 构建脚本工作原理

`scripts/build-for-capacitor.js`:
1. 临时移动 `app/api` 目录到 `.temp-api`
2. 运行 Next.js 构建（静态导出）
3. 恢复 `app/api` 目录

这样 Next.js 就不会尝试导出 API routes，避免了错误。

---

## ✅ 验证清单

- [x] 修复了导入路径错误
- [x] 创建了 Capacitor 构建脚本
- [x] 更新了构建配置
- [x] 构建成功完成
- [ ] iOS 同步（下一步）
- [ ] Xcode 构建测试（下一步）

---

## 🎯 下一步

现在可以继续 iOS 同步了：

```bash
npx cap sync ios
npx cap open ios
```

在 Xcode 中：
1. 按 `⌘+B` 构建项目
2. 按 `⌘+R` 运行应用
3. 测试功能是否正常

