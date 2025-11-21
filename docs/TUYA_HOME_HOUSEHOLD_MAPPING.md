# Tuya Home 與 Household 對應關係
## Tuya Home to Household Mapping

## 📖 概述 / Overview

現在 **Tuya Home** 與我們的 **Household** 已經建立了對應關係：

- ✅ 每個 Household 對應一個 Tuya Home
- ✅ 配網時自動使用當前 Household 對應的 Tuya Home
- ✅ 如果 Tuya Home 不存在，會自動創建（使用 Household 名稱）
- ✅ 配網成功後自動更新對應關係

---

## 🏗️ 架構設計 / Architecture

### 數據庫結構 / Database Schema

在 `Household` 表中添加了 `tuyaHomeId` 字段：

```prisma
model Household {
  id              String            @id
  name            String
  tuyaHomeId      String?            @unique @map("tuya_home_id") // 對應的 Tuya Home ID
  // ... 其他字段
}
```

### 工作流程 / Workflow

```
1. 用戶選擇 Household
   ↓
2. 開始配網（傳遞 householdId 和 householdName）
   ↓
3. iOS 插件檢查/創建 Tuya Home
   - 如果已有 Home → 使用現有 Home
   - 如果沒有 Home → 創建新 Home（使用 Household 名稱）
   ↓
4. 配網成功
   ↓
5. 更新 Household.tuyaHomeId = Tuya Home ID
```

---

## 🔧 實現細節 / Implementation Details

### 1. 數據庫 Schema

**文件**: `prisma/schema.prisma`

```prisma
model Household {
  tuyaHomeId      String?            @unique @map("tuya_home_id")
  // ...
}
```

### 2. API 端點

**文件**: `app/api/mqtt/tuya/home/route.ts`

- `GET /api/mqtt/tuya/home?householdId=xxx` - 獲取 Household 對應的 Tuya Home ID
- `POST /api/mqtt/tuya/home` - 更新 Household 的 Tuya Home ID 對應關係

### 3. iOS 插件更新

**文件**: `ios/App/App/Plugins/TuyaProvisioningPlugin.swift`

- `ensureHomeExists(householdName:)` - 使用 Household 名稱創建/獲取 Tuya Home
- `startProvisioning` - 接收 `householdId` 和 `householdName` 參數
- 配網成功後返回 `householdId` 和 `tuyaHomeId`

### 4. 前端更新

**文件**: `components/mqtt/ProvisioningModal.tsx`

- 使用 `useHousehold()` 獲取當前 Household
- 配網時傳遞 `householdId` 和 `householdName`
- 配網成功後調用 `updateTuyaHomeMapping()` 更新對應關係

### 5. 類型定義

**文件**: `lib/plugins/tuya/index.ts`

```typescript
export interface TuyaStartProvisioningOptions {
  // ... 其他字段
  householdId?: string    // Household ID
  householdName?: string  // Household 名稱
}
```

---

## 📝 使用說明 / Usage

### 配網流程

1. **用戶選擇 Household**
   - 在應用中選擇要使用的 Household

2. **開始配網**
   - 打開配網模態框
   - 系統自動使用當前 Household 的信息

3. **自動創建/使用 Tuya Home**
   - 如果該 Household 已有對應的 Tuya Home → 直接使用
   - 如果沒有 → 自動創建（使用 Household 名稱）

4. **配網成功**
   - 系統自動更新 `Household.tuyaHomeId`
   - 後續配網會使用同一個 Tuya Home

---

## 🔄 遷移現有數據 / Migration

對於現有的 Household（沒有 `tuyaHomeId`）：

1. **首次配網時自動創建**
   - 配網時會自動創建 Tuya Home
   - 配網成功後自動更新對應關係

2. **手動更新（可選）**
   - 可以通過 API 手動更新 `tuyaHomeId`

---

## ✅ 優勢 / Benefits

1. **一對一對應**
   - 每個 Household 對應一個 Tuya Home
   - 設備按 Household 組織

2. **自動管理**
   - 無需手動創建 Tuya Home
   - 配網時自動處理

3. **名稱同步**
   - Tuya Home 名稱使用 Household 名稱
   - 保持一致性

4. **多 Household 支持**
   - 支持多個 Household
   - 每個 Household 有獨立的 Tuya Home

---

## 🐛 故障排除 / Troubleshooting

### 問題：配網時提示 "No Tuya home available"

**解決方案**:
- 檢查是否提供了 `householdId` 和 `householdName`
- 檢查 Tuya SDK 是否正確初始化
- 檢查 iOS 插件是否正確接收參數

### 問題：配網成功但對應關係未更新

**解決方案**:
- 檢查 `updateTuyaHomeMapping()` 是否被調用
- 檢查 API 端點是否正常工作
- 檢查數據庫權限

### 問題：多個 Household 使用同一個 Tuya Home

**解決方案**:
- 確保每個 Household 有獨立的 `tuyaHomeId`
- 檢查配網時是否傳遞了正確的 `householdId`

---

## 📚 相關文件 / Related Files

- `prisma/schema.prisma` - 數據庫 Schema
- `app/api/mqtt/tuya/home/route.ts` - API 端點
- `lib/tuya-home-manager.ts` - Tuya Home 管理工具
- `ios/App/App/Plugins/TuyaProvisioningPlugin.swift` - iOS 插件
- `components/mqtt/ProvisioningModal.tsx` - 配網 UI
- `lib/provisioning/native-client.ts` - 原生客戶端工具

---

## 🎯 下一步 / Next Steps

1. **數據庫遷移**
   - 運行 `npx prisma migrate dev` 添加 `tuyaHomeId` 字段

2. **測試**
   - 測試配網流程
   - 驗證對應關係更新

3. **文檔更新**
   - 更新用戶文檔
   - 更新開發文檔

