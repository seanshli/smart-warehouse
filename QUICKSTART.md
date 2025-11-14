# Quick Start Guide
<!-- 快速開始指南 -->

Get your Smart Warehouse app running in 5 minutes!
<!-- 在 5 分鐘內啟動您的 Smart Warehouse 應用程式！ -->

## 🚀 Quick Setup
<!-- 快速設定 -->

1. **Run the setup script**
   <!-- 執行設定腳本 -->
   ```bash
   npm run setup
   ```

2. **Add your OpenAI API key**
   <!-- 添加您的 OpenAI API 金鑰 -->
   Edit `.env.local` and add your OpenAI API key:
   <!-- 編輯 `.env.local` 並添加您的 OpenAI API 金鑰： -->
   ```env
   OPENAI_API_KEY="sk-your-openai-api-key-here"
   ```

3. **Start the development server**
   <!-- 啟動開發伺服器 -->
   ```bash
   npm run dev
   ```

4. **Open your browser**
   <!-- 開啟瀏覽器 -->
   Go to [http://localhost:3000](http://localhost:3000)

## 🎯 First Steps
<!-- 第一步 -->

1. **Sign up/Login** - Create an account or use Google OAuth
   <!-- 註冊/登入 - 創建帳戶或使用 Google OAuth -->
2. **Add your first item** - Click "Add Item" and try uploading a photo
   <!-- 添加您的第一個物品 - 點擊「添加物品」並嘗試上傳照片 -->
3. **Create rooms** - Go to "Rooms" tab and add your first room
   <!-- 創建房間 - 前往「房間」標籤並添加您的第一個房間 -->
4. **Set up categories** - Go to "Categories" tab and create your category structure
   <!-- 設定分類 - 前往「分類」標籤並創建您的分類結構 -->

## 📱 Mobile Usage
<!-- 行動裝置使用 -->

- **Native Apps**: Full native iOS and Android apps available
  <!-- 原生應用程式：提供完整的原生 iOS 和 Android 應用程式 -->
- **Install as PWA**: Click the install button in your mobile browser
  <!-- 安裝為 PWA：在行動瀏覽器中點擊安裝按鈕 -->
- **Camera access**: Allow camera permissions for photo capture and barcode scanning
  <!-- 相機存取：允許相機權限以進行照片拍攝和條碼掃描 -->
- **Native Barcode Scanning**: iOS and Android use native libraries for better performance
  <!-- 原生條碼掃描：iOS 和 Android 使用原生函式庫以獲得更好的性能 -->
- **Voice Assistant**: Use the Assistant tab for voice interactions (iOS/Android)
  <!-- 語音助理：使用「助理」標籤進行語音互動（iOS/Android） -->
- **Home Assistant**: Control smart home devices from the app
  <!-- Home Assistant：從應用程式控制智能家居裝置 -->

## 🔧 Troubleshooting

### Common Issues

**"OpenAI API Error"**
- Make sure your API key is correct in `.env.local`
- Check your OpenAI account has credits

**"Database Error"**
- Run `npm run db:push` to reset the database
- Check that SQLite is working properly

**"Authentication Issues"**
- Clear browser cookies and try again
- Make sure `NEXTAUTH_SECRET` is set in `.env.local`

### Getting Help

- Check the full [README.md](README.md) for detailed documentation
- Open an issue on GitHub for bugs
- Check the console for error messages

## 🎉 You're Ready!

Your Smart Warehouse is now running! Start adding items and organizing your household inventory with AI-powered recognition.


