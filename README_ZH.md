# Smart Warehouse - AI-Powered Inventory Management
<!-- 智能倉庫 - AI 驅動的庫存管理系統 -->

<!-- 
  這是一個全面的倉庫式庫存管理系統，使用 AI 從照片、條碼和 QR 碼識別物品。
  非常適合具有多用戶支援的家庭庫存管理。
-->

## Features
<!-- 功能特色 -->

### 🤖 AI-Powered Item Recognition
<!-- AI 驅動的物品識別 -->
- **Photo Recognition**: Upload photos or take pictures with your camera
  <!-- 照片識別：上傳照片或使用相機拍照 -->
- **Native Barcode Scanning**: iOS uses AVFoundation, Android uses ML Kit for superior performance
  <!-- 原生條碼掃描：iOS 使用 AVFoundation，Android 使用 ML Kit 以獲得優異性能 -->
- **Web Barcode Scanning**: Fallback to Quagga.js for browser-based scanning
  <!-- 網頁條碼掃描：瀏覽器環境下使用 Quagga.js 作為備援方案 -->
- **QR Code Scanning**: Support for QR code-based item identification
  <!-- QR 碼掃描：支援基於 QR 碼的物品識別 -->
- **OpenAI Integration**: Uses GPT-4 Vision for intelligent item recognition
  <!-- OpenAI 整合：使用 GPT-4 Vision 進行智能物品識別 -->
- **Taiwan E-Invoice**: Automatic decoding of Taiwan e-invoice QR codes
  <!-- 台灣電子發票：自動解碼台灣電子發票 QR 碼 -->

### 🏠 Multi-User Household Management
<!-- 多用戶家庭管理 -->
- **User Authentication**: Secure login with Google OAuth or email/password
  <!-- 用戶認證：使用 Google OAuth 或電子郵件/密碼進行安全登入 -->
- **Household Sharing**: Multiple users can access the same household inventory
  <!-- 家庭共享：多個用戶可以存取同一個家庭庫存 -->
- **Role Management**: Admin and member roles for household management
  <!-- 角色管理：管理員和成員角色用於家庭管理 -->

### 📍 Location Management
<!-- 位置管理 -->
- **Room Organization**: Create and manage rooms within your household
  <!-- 房間組織：在家庭內創建和管理房間 -->
- **Cabinet System**: Organize items within cabinets and shelves
  <!-- 櫥櫃系統：在櫥櫃和架子上組織物品 -->
- **Flexible Structure**: Add new rooms and cabinets as needed
  <!-- 靈活結構：根據需要添加新房間和櫥櫃 -->

### 🏷️ Hierarchical Categories
<!-- 階層式分類 -->
- **3-Level Categories**: Organize items with up to 3 levels of categorization
  <!-- 三級分類：使用最多 3 級分類來組織物品 -->
- **Custom Categories**: Create your own category structure
  <!-- 自訂分類：創建您自己的分類結構 -->
- **Smart Suggestions**: AI suggests categories based on item recognition
  <!-- 智能建議：AI 根據物品識別建議分類 -->

### 🔍 Advanced Search
<!-- 進階搜尋 -->
- **Multi-Field Search**: Search by name, description, barcode, or QR code
  <!-- 多欄位搜尋：按名稱、描述、條碼或 QR 碼搜尋 -->
- **Filter by Category**: Narrow down results by category
  <!-- 按分類篩選：按分類縮小結果範圍 -->
- **Filter by Location**: Find items by room or cabinet
  <!-- 按位置篩選：按房間或櫥櫃查找物品 -->
- **Real-time Results**: Instant search results as you type
  <!-- 即時結果：輸入時即時顯示搜尋結果 -->

### 📊 Inventory Tracking
<!-- 庫存追蹤 -->
- **Quantity Management**: Track item quantities
  <!-- 數量管理：追蹤物品數量 -->
- **Low Stock Alerts**: Set custom thresholds for inventory notifications
  <!-- 低庫存提醒：為庫存通知設定自訂閾值 -->
- **Automatic Notifications**: Get notified when items are running low
  <!-- 自動通知：當物品庫存不足時收到通知 -->
- **Activity Tracking**: Monitor recent additions and changes
  <!-- 活動追蹤：監控最近的添加和變更 -->

### 📱 Cross-Platform Support
<!-- 跨平台支援 -->
- **Native iOS App**: Full native app with Capacitor (iOS 14+)
  <!-- 原生 iOS 應用程式：使用 Capacitor 的完整原生應用程式（iOS 14+） -->
- **Native Android App**: Full native app with Capacitor (Android 5.0+)
  <!-- 原生 Android 應用程式：使用 Capacitor 的完整原生應用程式（Android 5.0+） -->
- **Progressive Web App**: Install as a native app on mobile devices
  <!-- 漸進式網頁應用程式：在行動裝置上安裝為原生應用程式 -->
- **Responsive Design**: Optimized for phones, tablets (including 10" tablets), and desktops
  <!-- 響應式設計：針對手機、平板電腦（包括 10 吋平板）和桌面進行優化 -->
- **Touch-Friendly**: Optimized for touch interactions with proper viewport handling
  <!-- 觸控友善：針對觸控互動進行優化，具有適當的視窗處理 -->

### 🎤 Voice Assistant
<!-- 語音助理 -->
- **AIUI Integration**: Native voice assistant powered by iFLYTEK AIUI
  <!-- AIUI 整合：由 iFLYTEK AIUI 驅動的原生語音助理 -->
- **OpenAI Fallback**: Automatic fallback to OpenAI for voice interactions
  <!-- OpenAI 備援：語音互動自動備援到 OpenAI -->
- **Multi-Language Support**: English, Traditional Chinese, Simplified Chinese, Japanese
  <!-- 多語言支援：英語、繁體中文、簡體中文、日語 -->
- **Voice Commands**: Ask questions about inventory, weather, and more
  <!-- 語音指令：詢問庫存、天氣等問題 -->

### 🏠 Home Assistant Integration
<!-- Home Assistant 整合 -->
- **Smart Home Control**: Control Home Assistant devices directly from the app
  <!-- 智能家居控制：直接從應用程式控制 Home Assistant 裝置 -->
- **Real-Time Sync**: Automatic status updates when devices are controlled elsewhere
  <!-- 即時同步：當裝置在其他地方被控制時自動更新狀態 -->
- **HomeKit-Style UI**: Beautiful, intuitive controls for smart home devices
  <!-- HomeKit 風格 UI：美觀直觀的智能家居裝置控制 -->
- **Device Management**: Power controls, mode selection, and status monitoring
  <!-- 裝置管理：電源控制、模式選擇和狀態監控 -->

## Technology Stack
<!-- 技術堆疊 -->

- **Frontend**: Next.js 14, React 18, TypeScript
  <!-- 前端：Next.js 14、React 18、TypeScript -->
- **Styling**: Tailwind CSS, Headless UI
  <!-- 樣式：Tailwind CSS、Headless UI -->
- **Database**: PostgreSQL (Supabase) / SQLite with Prisma ORM
  <!-- 資料庫：PostgreSQL (Supabase) / 使用 Prisma ORM 的 SQLite -->
- **Authentication**: NextAuth.js
  <!-- 認證：NextAuth.js -->
- **AI Integration**: 
  <!-- AI 整合： -->
  - OpenAI GPT-4 Vision API (image recognition)
    <!-- OpenAI GPT-4 Vision API（圖像識別） -->
  - OpenAI GPT-4o-mini (text processing)
    <!-- OpenAI GPT-4o-mini（文字處理） -->
  - OpenAI Whisper (speech-to-text fallback)
    <!-- OpenAI Whisper（語音轉文字備援） -->
- **Voice**: 
  <!-- 語音： -->
  - iFLYTEK AIUI (primary - native iOS/Android)
    <!-- iFLYTEK AIUI（主要 - 原生 iOS/Android） -->
  - OpenAI Whisper (fallback)
    <!-- OpenAI Whisper（備援） -->
- **Native Mobile**: Capacitor 7 (iOS & Android)
  <!-- 原生行動裝置：Capacitor 7（iOS 和 Android） -->
- **Barcode Scanning**: 
  <!-- 條碼掃描： -->
  - Native: AVFoundation (iOS), ML Kit (Android)
    <!-- 原生：AVFoundation (iOS)、ML Kit (Android) -->
  - Web: Quagga.js (fallback)
    <!-- 網頁：Quagga.js（備援） -->
- **Home Assistant**: WebSocket API integration
  <!-- Home Assistant：WebSocket API 整合 -->
- **Image Processing**: React Dropzone, Canvas API
  <!-- 圖像處理：React Dropzone、Canvas API -->

## Getting Started
<!-- 開始使用 -->

### Prerequisites
<!-- 先決條件 -->

- Node.js 18+ 
- npm or yarn
- OpenAI API key
  <!-- OpenAI API 金鑰 -->
- (Optional) iFLYTEK API credentials for native voice features
  <!-- （可選）iFLYTEK API 憑證，用於原生語音功能 -->
- (Optional) Home Assistant instance for smart home integration
  <!-- （可選）Home Assistant 實例，用於智能家居整合 -->

### Installation
<!-- 安裝 -->

1. **Clone the repository**
   <!-- 複製儲存庫 -->
   ```bash
   git clone <repository-url>
   cd smart-warehouse
   ```

2. **Install dependencies**
   <!-- 安裝依賴項 -->
   ```bash
   npm install
   ```

3. **Set up environment variables**
   <!-- 設定環境變數 -->
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your configuration:
   <!-- 編輯 `.env.local` 並添加您的配置： -->
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   OPENAI_API_KEY="your-openai-api-key"
   OPENAI_VISION_MODEL="gpt-4o"
   OPENAI_TEXT_MODEL="gpt-4o-mini"
   
   # Optional: iFLYTEK for native voice features
   # 可選：iFLYTEK 用於原生語音功能
   IFLYTEK_APP_KEY="your-iflytek-app-key"
   IFLYTEK_APP_SECRET="your-iflytek-app-secret"
   AIUI_DEVICE_SERIAL="SMARTPAD000037"
   
   # Optional: Home Assistant integration
   # 可選：Home Assistant 整合
   HOME_ASSISTANT_BASE_URL="https://your-home-assistant-instance.com"
   HOME_ASSISTANT_ACCESS_TOKEN="your-long-lived-access-token"
   ```

4. **Set up the database**
   <!-- 設定資料庫 -->
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   <!-- 啟動開發伺服器 -->
   ```bash
   npm run dev
   ```

6. **Open your browser**
   <!-- 開啟瀏覽器 -->
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage
<!-- 使用方式 -->

### Adding Items
<!-- 添加物品 -->

1. **Click "Add Item"** on the dashboard
   <!-- 在儀表板上點擊「添加物品」 -->
2. **Choose input method**:
   <!-- 選擇輸入方式： -->
   - Upload a photo
     <!-- 上傳照片 -->
   - Take a photo with camera
     <!-- 使用相機拍照 -->
   - Scan a barcode (native on iOS/Android, web fallback on browsers)
     <!-- 掃描條碼（iOS/Android 上使用原生，瀏覽器上使用網頁備援） -->
   - Scan a QR code
     <!-- 掃描 QR 碼 -->
   - Upload Taiwan e-invoice
     <!-- 上傳台灣電子發票 -->
3. **Review AI suggestions** for name, description, and category
   <!-- 檢視 AI 建議的名稱、描述和分類 -->
4. **Set quantity and location** (room and cabinet)
   <!-- 設定數量和位置（房間和櫥櫃） -->
5. **Configure low stock alerts** if needed
   <!-- 如需要，配置低庫存提醒 -->

### Using Voice Assistant
<!-- 使用語音助理 -->

1. **Go to "Assistant" tab** on the dashboard
   <!-- 前往儀表板上的「助理」標籤 -->
2. **Type or speak** your question
   <!-- 輸入或說出您的問題 -->
3. **Get AI-powered responses** about your inventory or general questions
   <!-- 獲得關於庫存或一般問題的 AI 驅動回應 -->
4. **Multi-language support** - works in English, Chinese, and Japanese
   <!-- 多語言支援 - 支援英語、中文和日語 -->

### Home Assistant Integration
<!-- Home Assistant 整合 -->

1. **Configure Home Assistant** in environment variables
   <!-- 在環境變數中配置 Home Assistant -->
2. **Go to "Home Assistant" tab** on the dashboard
   <!-- 前往儀表板上的「Home Assistant」標籤 -->
3. **View and control** your smart home devices
   <!-- 檢視和控制您的智能家居裝置 -->
4. **Real-time updates** when devices are controlled elsewhere
   <!-- 當裝置在其他地方被控制時即時更新 -->

### Managing Locations
<!-- 管理位置 -->

1. **Go to "Rooms" tab**
   <!-- 前往「房間」標籤 -->
2. **Add new rooms** (Kitchen, Living Room, Garage, etc.)
   <!-- 添加新房間（廚房、客廳、車庫等） -->
3. **Add cabinets** within each room
   <!-- 在每個房間內添加櫥櫃 -->
4. **Organize items** by assigning them to specific locations
   <!-- 通過將物品分配到特定位置來組織物品 -->

### Setting Up Categories
<!-- 設定分類 -->

1. **Go to "Categories" tab**
   <!-- 前往「分類」標籤 -->
2. **Create level 1 categories** (Electronics, Kitchen, Tools, etc.)
   <!-- 創建一級分類（電子產品、廚房、工具等） -->
3. **Add subcategories** (Level 2 and 3) as needed
   <!-- 根據需要添加子分類（二級和三級） -->
4. **Organize items** using the hierarchical structure
   <!-- 使用階層結構組織物品 -->

### Search and Find Items
<!-- 搜尋和查找物品 -->

1. **Click "Search"** on the dashboard
   <!-- 在儀表板上點擊「搜尋」 -->
2. **Enter search terms** (name, description, barcode, QR code)
   <!-- 輸入搜尋詞（名稱、描述、條碼、QR 碼） -->
3. **Apply filters** by category or room
   <!-- 按分類或房間應用篩選器 -->
4. **View results** with location information
   <!-- 檢視帶有位置資訊的結果 -->

## API Endpoints
<!-- API 端點 -->

### Items
<!-- 物品 -->
- `GET /api/items` - Get all items with optional search/filter
  <!-- 取得所有物品，可選搜尋/篩選 -->
- `POST /api/items` - Create a new item
  <!-- 創建新物品 -->

### Rooms
<!-- 房間 -->
- `GET /api/rooms` - Get all rooms
  <!-- 取得所有房間 -->
- `POST /api/rooms` - Create a new room
  <!-- 創建新房間 -->

### Cabinets
<!-- 櫥櫃 -->
- `POST /api/cabinets` - Create a new cabinet
  <!-- 創建新櫥櫃 -->

### Categories
<!-- 分類 -->
- `GET /api/categories` - Get all categories
  <!-- 取得所有分類 -->
- `POST /api/categories` - Create a new category
  <!-- 創建新分類 -->

### Notifications
<!-- 通知 -->
- `GET /api/notifications` - Get all notifications
  <!-- 取得所有通知 -->
- `PATCH /api/notifications/[id]` - Mark notification as read
  <!-- 標記通知為已讀 -->
- `PATCH /api/notifications/mark-all-read` - Mark all notifications as read
  <!-- 標記所有通知為已讀 -->

## Database Schema
<!-- 資料庫架構 -->

The application uses a relational database with the following main entities:
<!-- 應用程式使用關聯式資料庫，具有以下主要實體： -->

- **Users**: User accounts with authentication
  <!-- 用戶：具有認證的用戶帳戶 -->
- **Households**: Multi-user household groups
  <!-- 家庭：多用戶家庭群組 -->
- **Rooms**: Physical locations within households
  <!-- 房間：家庭內的實體位置 -->
- **Cabinets**: Storage areas within rooms
  <!-- 櫥櫃：房間內的儲存區域 -->
- **Categories**: Hierarchical item categorization (3 levels)
  <!-- 分類：階層式物品分類（3 級） -->
- **Items**: Inventory items with AI-generated metadata
  <!-- 物品：具有 AI 生成元資料的庫存物品 -->
- **Notifications**: Low stock and system alerts
  <!-- 通知：低庫存和系統提醒 -->

## Deployment
<!-- 部署 -->

### Vercel (Recommended)
<!-- Vercel（推薦） -->

1. **Push to GitHub**
   <!-- 推送到 GitHub -->
2. **Connect to Vercel**
   <!-- 連接到 Vercel -->
3. **Set environment variables** in Vercel dashboard
   <!-- 在 Vercel 儀表板中設定環境變數 -->
4. **Deploy automatically**
   <!-- 自動部署 -->

### Other Platforms
<!-- 其他平台 -->

The app can be deployed to any platform that supports Next.js:
<!-- 應用程式可以部署到任何支援 Next.js 的平台： -->
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing
<!-- 貢獻 -->

1. Fork the repository
   <!-- 分叉儲存庫 -->
2. Create a feature branch
   <!-- 創建功能分支 -->
3. Make your changes
   <!-- 進行變更 -->
4. Add tests if applicable
   <!-- 如適用，添加測試 -->
5. Submit a pull request
   <!-- 提交拉取請求 -->

## License
<!-- 授權 -->

This project is licensed under the MIT License.
<!-- 本專案採用 MIT 授權。 -->

## Support
<!-- 支援 -->

For support, please open an issue on GitHub or contact the development team.
<!-- 如需支援，請在 GitHub 上開啟問題或聯繫開發團隊。 -->

## Current Versions
<!-- 目前版本 -->

- **Web**: 0.1.3
- **iOS**: 1.0.6 (Build 25)
- **Android**: 1.0.16 (Build 16)

## Roadmap
<!-- 路線圖 -->

- [ ] Barcode/QR code generation
  <!-- 條碼/QR 碼生成 -->
- [ ] Advanced analytics and reporting
  <!-- 進階分析和報告 -->
- [ ] Integration with shopping lists
  <!-- 與購物清單整合 -->
- [ ] Enhanced offline support
  <!-- 增強的離線支援 -->
- [ ] Additional language support
  <!-- 額外的語言支援 -->
- [ ] Export/Import functionality
  <!-- 匯出/匯入功能 -->

