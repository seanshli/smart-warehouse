# Capacitor 构建修复说明
## Capacitor Build Fix Explanation

## 问题 / Problem

Next.js App Router 的静态导出（`output: 'export'`）不能与 API routes 一起使用，因为：
1. API routes 需要服务器端运行
2. 静态导出会尝试导出所有路由，包括 API routes
3. `export const dynamic = "force-dynamic"` 在静态导出中会导致错误

## 解决方案 / Solution

对于 Capacitor 应用，我们使用以下策略：

1. **静态导出页面**：只导出前端页面（HTML/JS/CSS）
2. **API 在服务器运行**：所有 API routes 在 Vercel 上运行
3. **Capacitor 配置**：使用 `server.url` 指向 Vercel 服务器

### 配置说明

**`capacitor.config.ts`**:
```typescript
server: {
  url: 'https://smart-warehouse-five.vercel.app',
  cleartext: false
}
```

这意味着：
- ✅ 前端页面打包在 iOS/Android 应用中
- ✅ API 调用通过 HTTPS 发送到 Vercel
- ✅ 支持离线查看（已加载的页面）
- ✅ API 功能正常工作（通过服务器）

## 构建命令 / Build Commands

### 正常构建（用于 Vercel）
```bash
npm run build
# 使用 output: 'standalone'，包含 API routes
```

### Capacitor 构建（用于 iOS/Android）
```bash
CAPACITOR_BUILD=true npm run build:production
# 使用 output: 'export'，只导出静态页面
```

## 注意事项 / Important Notes

1. **API Routes 不会包含在静态导出中**
   - 这是正常的，因为它们需要在服务器上运行
   - Capacitor 应用会通过 `server.url` 调用 API

2. **静态导出警告**
   - `headers` 配置在静态导出中不工作（这是正常的）
   - 这些警告可以忽略

3. **构建错误**
   - 如果看到 `export const dynamic = "force-dynamic"` 错误
   - 这意味着某个 API route 被错误地包含在静态导出中
   - 需要检查并修复该 API route

## 当前状态 / Current Status

✅ 已修复：
- `app/items/page.tsx` 的导入路径
- `next.config.js` 的构建配置
- `package.json` 的构建脚本

⚠️ 待解决：
- API routes 的 `dynamic` 导出问题
- 需要确保 API routes 不被静态导出

## 下一步 / Next Steps

1. 测试构建是否成功
2. 如果仍有错误，检查具体的 API route
3. 确保 Capacitor 配置正确指向 Vercel

