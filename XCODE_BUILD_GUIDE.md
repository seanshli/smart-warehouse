# Xcode 構建指南

## 打開項目

1. **使用終端打開**（已自動執行）：
   ```bash
   open ios/App/App.xcworkspace
   ```
   
   或者手動：
   - 打開 Finder
   - 導航到 `smart-warehouse/ios/App/`
   - 雙擊 `App.xcworkspace`（**不是** `App.xcodeproj`）

## 確認 NativeBarcodeScanner.swift 已添加

1. **在 Xcode 左側項目導航器中**：
   - 展開 `App` 文件夾
   - 找到 `Plugins` 文件夾
   - 確認 `NativeBarcodeScanner.swift` 在列表中
   - 如果沒有，右鍵點擊 `Plugins` → "Add Files to App..." → 選擇 `NativeBarcodeScanner.swift`

2. **檢查文件是否在構建目標中**：
   - 點擊項目名稱（頂部藍色圖標）
   - 選擇 `App` target
   - 點擊 `Build Phases` 標籤
   - 展開 `Compile Sources`
   - 確認 `NativeBarcodeScanner.swift` 在列表中
   - 如果沒有，點擊 `+` 按鈕添加

## 構建項目

1. **選擇目標設備**：
   - 在 Xcode 頂部工具欄
   - 點擊設備選擇器（顯示 "App > iPhone 15 Pro" 或類似）
   - 選擇：
     - **模擬器**：iPhone 15 Pro, iPhone 15, iPad Pro 等
     - **真機**：連接的 iOS 設備（需要開發者帳號）

2. **構建項目**：
   - 按 `Cmd + B`（構建）
   - 或點擊 `Product` → `Build`
   - 等待構建完成

3. **運行應用**：
   - 按 `Cmd + R`（運行）
   - 或點擊 `Product` → `Run`
   - 應用將在選定的設備/模擬器上啟動

## 常見問題

### 如果構建失敗：

1. **清理構建文件夾**：
   - `Product` → `Clean Build Folder`（或按 `Shift + Cmd + K`）

2. **重新安裝 Pods**：
   ```bash
   cd ios/App
   pod install
   ```

3. **檢查編碼設置**：
   - 確保終端使用 UTF-8 編碼
   - 在終端運行：`export LANG=en_US.UTF-8`

### 如果找不到 NativeBarcodeScanner.swift：

1. **手動添加文件**：
   - 在 Xcode 項目導航器中，右鍵點擊 `Plugins` 文件夾
   - 選擇 "Add Files to App..."
   - 導航到 `ios/App/App/Plugins/NativeBarcodeScanner.swift`
   - 確保勾選 "Copy items if needed"（如果文件不在項目目錄中）
   - 確保選擇 "App" target
   - 點擊 "Add"

2. **檢查文件路徑**：
   - 文件應該在：`ios/App/App/Plugins/NativeBarcodeScanner.swift`
   - 如果路徑不對，在 Finder 中移動文件到正確位置

## 驗證插件已註冊

1. **運行應用後**：
   - 打開瀏覽器開發者工具（如果使用模擬器）
   - 在控制台中輸入：
     ```javascript
     window.Capacitor.Plugins.NativeBarcodeScanner
     ```
   - 應該看到插件對象，而不是 `undefined`

2. **測試掃描功能**：
   - 在應用中打開條碼掃描器
   - 應該使用原生相機界面（而不是網頁版本）

