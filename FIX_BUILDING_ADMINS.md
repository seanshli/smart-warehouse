# 修復建築管理員和工作團隊成員

## 方法 1：瀏覽器控制台（推薦）

1. 打開應用網站並登錄為管理員
2. 按 F12（或 Cmd+Option+I）打開開發者工具
3. 切換到 Console 標籤
4. 複製並運行以下代碼：

```javascript
fetch('/api/admin/fix-building-admins', { 
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(async r => {
  const data = await r.json();
  if (!r.ok) {
    throw new Error(data.error || `HTTP ${r.status}: ${r.statusText}`);
  }
  return data;
})
.then(data => {
  console.log('✅ 修復完成！', data);
  if (data.summary) {
    alert(`修復完成！\n總數: ${data.summary.total}\n已修復: ${data.summary.fixed}\n跳過: ${data.summary.skipped}\n錯誤: ${data.summary.errors}`);
  } else {
    alert('修復完成！\n' + JSON.stringify(data, null, 2));
  }
})
.catch(err => {
  console.error('❌ 錯誤:', err);
  alert('修復失敗: ' + err.message);
});
```

## 方法 2：使用 curl（需要認證）

```bash
# 本地開發環境
curl -X POST http://localhost:3000/api/admin/fix-building-admins \
  -H "Content-Type: application/json" \
  --cookie "your-session-cookie"

# Vercel 生產環境（需要替換為實際 URL）
curl -X POST https://your-app.vercel.app/api/admin/fix-building-admins \
  -H "Content-Type: application/json" \
  --cookie "your-session-cookie"
```

## 方法 3：使用 Node.js 腳本

```bash
# 本地開發環境
node scripts/fix-building-admins.js

# Vercel 生產環境
VERCEL_URL=your-app.vercel.app node scripts/fix-building-admins.js
```

## 預期響應

成功時會返回：
```json
{
  "success": true,
  "message": "Fixed X building admins/working team members, skipped Y, errors: Z",
  "summary": {
    "total": 10,
    "fixed": 8,
    "skipped": 1,
    "errors": 1
  },
  "results": [...]
}
```

## 常見錯誤

1. **401 Unauthorized**: 需要登錄為管理員
2. **403 Forbidden**: 當前用戶不是管理員
3. **500 Internal Server Error**: 數據庫連接問題

