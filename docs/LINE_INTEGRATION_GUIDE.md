# LINE 對話集成指南

## 📱 概述

本指南說明如何將 LINE Messaging API 集成到 Smart Warehouse 系統中，讓住戶可以通過 LINE 與家庭成員進行對話。

## 🎯 功能目標

1. **住戶 LINE 對話**：讓同一 household 的成員可以通過 LINE 群組進行溝通
2. **自動群組創建**：當用戶加入 household 時，自動創建或加入對應的 LINE 群組
3. **消息同步**：將 LINE 消息同步到系統內的消息記錄
4. **通知推送**：通過 LINE 發送包裹、郵件、門鈴等通知

## 📋 前置需求

### 1. LINE Developers 帳號
- 註冊：https://developers.line.biz/
- 創建 Provider
- 創建 Messaging API Channel

### 2. LINE 官方帳號
- 在 LINE Official Account Manager 創建官方帳號
- 啟用 Messaging API
- 獲取 Channel Access Token 和 Channel Secret

### 3. Webhook URL
- 需要 HTTPS 端點接收 LINE 消息
- 例如：`https://smart-warehouse-five.vercel.app/api/line/webhook`

## 🏗️ 架構設計

### 數據庫擴展

```prisma
// 添加到 prisma/schema.prisma

model LineGroup {
  id          String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  householdId String   @unique @map("household_id")
  lineGroupId String   @unique @map("line_group_id") // LINE 群組 ID
  name        String   // 群組名稱
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  household Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  
  @@map("line_groups")
}

model LineUser {
  id          String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  userId      String   @unique @map("user_id")
  lineUserId  String   @unique @map("line_user_id") // LINE User ID
  displayName String?  @map("display_name")
  pictureUrl  String?  @map("picture_url")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("line_users")
}

model LineMessage {
  id          String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  lineMessageId String @unique @map("line_message_id")
  conversationId String? @map("conversation_id") // 關聯到系統內的對話
  lineUserId  String   @map("line_user_id")
  messageType String   @map("message_type") // 'text' | 'image' | 'sticker' | 'file'
  content     String   // 消息內容
  metadata    Json?    // 額外數據（圖片 URL、貼圖 ID 等）
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  
  conversation Conversation? @relation(fields: [conversationId], references: [id], onDelete: SetNull)
  
  @@index([conversationId])
  @@index([lineUserId])
  @@index([createdAt])
  @@map("line_messages")
}
```

### 環境變量

```env
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
LINE_WEBHOOK_URL=https://smart-warehouse-five.vercel.app/api/line/webhook
```

## 🔧 實現步驟

### 步驟 1: 安裝依賴

```bash
npm install @line/bot-sdk
```

### 步驟 2: 創建 LINE Webhook 端點

創建 `app/api/line/webhook/route.ts` 來接收 LINE 消息

### 步驟 3: 創建 LINE API 服務

創建 `lib/line.ts` 來處理 LINE API 調用

### 步驟 4: 添加用戶 LINE 綁定

創建 UI 讓用戶綁定他們的 LINE 帳號

### 步驟 5: 自動群組管理

當用戶加入 household 時，自動創建或邀請加入 LINE 群組

## 📊 功能流程

### 1. 用戶綁定 LINE 帳號
```
用戶登錄 → 設置頁面 → 綁定 LINE → 掃描 QR Code → 確認綁定
```

### 2. 自動創建 LINE 群組
```
用戶加入 Household → 檢查是否有 LINE 群組 → 
  如果沒有：創建新群組 → 邀請所有成員
  如果有：邀請新成員加入
```

### 3. 消息同步
```
LINE 群組收到消息 → Webhook 接收 → 
  保存到 LineMessage → 同步到 Conversation → 
  通知相關用戶
```

### 4. 發送通知
```
系統事件（包裹、郵件等）→ 
  查找對應 LINE 群組 → 
  通過 LINE API 發送消息
```

## 💰 成本考量

- **群組消息計費**：發送一條消息給 N 人群組 = N 條消息費用
- **免費額度**：每月 500 條消息（需確認最新政策）
- **付費方案**：根據實際使用量計費

## 🔒 安全考量

1. **Webhook 驗證**：驗證 LINE 簽名確保消息來源
2. **Token 管理**：安全存儲 Channel Access Token
3. **用戶隱私**：確保只有 household 成員可以訪問群組
4. **數據加密**：敏感信息加密存儲

## 📱 用戶體驗

### 優勢
- ✅ 用戶熟悉的 LINE 界面
- ✅ 無需下載額外應用
- ✅ 支持圖片、貼圖、文件等豐富內容
- ✅ 即時通知推送

### 限制
- ⚠️ 需要用戶有 LINE 帳號
- ⚠️ 群組消息有成本
- ⚠️ 需要 LINE 官方帳號維護

## 🚀 下一步

1. 創建示例代碼和 API 端點
2. 實現用戶綁定流程
3. 實現群組自動管理
4. 實現消息同步
5. 測試和優化

