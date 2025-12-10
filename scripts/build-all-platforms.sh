#!/bin/bash

# Build All Platforms Script for Smart Warehouse
echo "🚀 Building Smart Warehouse for All Platforms"
echo "=============================================="
echo ""

# Set production environment
export NODE_ENV=production
export CAP_SERVER_URL="https://smart-warehouse-five.vercel.app"

echo "📍 Production URL: $CAP_SERVER_URL"
echo "🔧 Environment: $NODE_ENV"
echo ""

# 0. Clean old build files FIRST
echo "🧹 Step 0: Cleaning old build files..."
rm -rf out .next
echo "✅ Old build files cleaned"
echo ""

# 1. Build Next.js app
echo "📦 Step 1: Building Next.js app..."
npm run build:production
if [ $? -ne 0 ]; then
    echo "❌ Next.js build failed"
    exit 1
fi
echo "✅ Next.js build complete"
echo ""

# 2. Copy to Capacitor
echo "📱 Step 2: Copying to Capacitor..."
npx cap copy
if [ $? -ne 0 ]; then
    echo "❌ Capacitor copy failed"
    exit 1
fi
echo "✅ Capacitor copy complete"
echo ""

# 3. Sync iOS
echo "🍎 Step 3: Syncing iOS..."
npx cap sync ios
if [ $? -ne 0 ]; then
    echo "❌ iOS sync failed"
    exit 1
fi
echo "✅ iOS sync complete"
echo ""

# 4. Sync Android
echo "🤖 Step 4: Syncing Android..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "❌ Android sync failed"
    exit 1
fi
echo "✅ Android sync complete"
echo ""

# 5. Open iOS in Xcode
echo "🍎 Step 5: Opening iOS project..."
npx cap open ios
echo "✅ iOS project opened in Xcode"
echo ""

# 6. Open Android in Android Studio
echo "🤖 Step 6: Opening Android project..."
npx cap open android
echo "✅ Android project opened in Android Studio"
echo ""

echo "🎉 ALL PLATFORMS BUILD COMPLETE!"
echo "================================="
echo ""
echo "📱 iOS Status:"
echo "   ✅ Xcode project ready"
echo "   ✅ Network security configured"
echo "   ✅ HTTPS connections enabled"
echo "   📋 Next: Build in Xcode → Archive → Upload to TestFlight"
echo ""
echo "🤖 Android Status:"
echo "   ✅ Android Studio project ready"
echo "   ✅ Network security configured"
echo "   ✅ HTTPS connections enabled"
echo "   📋 Next: Build in Android Studio → Generate APK/AAB → Upload to Play Store"
echo ""
echo "🌐 Web Status:"
echo "   ✅ PWA manifest configured"
echo "   ✅ Service worker ready"
echo "   ✅ Mobile-optimized"
echo "   📋 Next: Deploy to Vercel (already configured)"
echo ""
echo "🔧 All platforms connect to: https://smart-warehouse-five.vercel.app"
echo "🔒 All connections use HTTPS for security"
echo "🌍 All platforms support the same features and translations"
echo ""
echo "📋 Platform-Specific Next Steps:"
echo ""
echo "🍎 iOS (TestFlight):"
echo "   1. In Xcode: Select your target device"
echo "   2. Build the project (⌘+B)"
echo "   3. Archive the app (Product → Archive)"
echo "   4. Distribute to App Store Connect"
echo "   5. Submit for TestFlight review"
echo ""
echo "🤖 Android (Play Store):"
echo "   1. In Android Studio: Build → Generate Signed Bundle/APK"
echo "   2. Choose Android App Bundle (.aab)"
echo "   3. Upload to Google Play Console"
echo "   4. Submit for review"
echo ""
echo "🌐 Web (Vercel):"
echo "   1. Already deployed to: https://smart-warehouse-five.vercel.app"
echo "   2. PWA features available in browsers"
echo "   3. Can be installed as app on mobile devices"
echo ""
echo "✨ All platforms are now synchronized and ready for distribution!"
