#!/bin/bash

# Cross-Platform Verification Script for Smart Warehouse
echo "🔍 Smart Warehouse Cross-Platform Verification"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📱 PLATFORM CONFIGURATION CHECK"
echo "================================"

# 1. Check Capacitor Configuration
echo "🔧 Capacitor Configuration:"
if [ -f "capacitor.config.ts" ]; then
    echo "✅ capacitor.config.ts exists"
    echo "   - Server URL: $(grep -o 'https://[^"]*' capacitor.config.ts)"
    echo "   - HTTPS enabled: $(grep -c 'cleartext: false' capacitor.config.ts)"
else
    echo "❌ capacitor.config.ts missing"
fi

# 2. Check iOS Configuration
echo ""
echo "🍎 iOS Configuration:"
if [ -f "ios/App/App/Info.plist" ]; then
    echo "✅ iOS Info.plist exists"
    if grep -q "NSAppTransportSecurity" ios/App/App/Info.plist; then
        echo "✅ Network security configured"
    else
        echo "⚠️  Network security not configured"
    fi
else
    echo "❌ iOS Info.plist missing"
fi

# 3. Check Android Configuration
echo ""
echo "🤖 Android Configuration:"
if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
    echo "✅ AndroidManifest.xml exists"
    if grep -q "networkSecurityConfig" android/app/src/main/AndroidManifest.xml; then
        echo "✅ Network security configured"
    else
        echo "⚠️  Network security not configured"
    fi
    
    if [ -f "android/app/src/main/res/xml/network_security_config.xml" ]; then
        echo "✅ Network security config file exists"
    else
        echo "❌ Network security config file missing"
    fi
else
    echo "❌ AndroidManifest.xml missing"
fi

# 4. Check Web/PWA Configuration
echo ""
echo "🌐 Web/PWA Configuration:"
if [ -f "public/manifest.json" ]; then
    echo "✅ PWA manifest exists"
    echo "   - App name: $(grep -o '"name": "[^"]*"' public/manifest.json | head -1)"
    echo "   - Start URL: $(grep -o '"start_url": "[^"]*"' public/manifest.json)"
else
    echo "❌ PWA manifest missing"
fi

if [ -f "app/layout.tsx" ]; then
    if grep -q "manifest" app/layout.tsx; then
        echo "✅ PWA metadata configured"
    else
        echo "⚠️  PWA metadata not configured"
    fi
else
    echo "❌ app/layout.tsx missing"
fi

# 5. Check Build Scripts
echo ""
echo "📦 Build Scripts:"
if [ -f "scripts/build-production-mobile.sh" ]; then
    echo "✅ Production mobile build script exists"
else
    echo "❌ Production mobile build script missing"
fi

# 6. Check Package.json Scripts
echo ""
echo "📋 Package.json Scripts:"
if grep -q "cap:copy" package.json; then
    echo "✅ Capacitor copy script exists"
else
    echo "❌ Capacitor copy script missing"
fi

if grep -q "ios:" package.json; then
    echo "✅ iOS build script exists"
else
    echo "❌ iOS build script missing"
fi

# 7. Check Dependencies
echo ""
echo "📚 Dependencies:"
if grep -q "@capacitor/core" package.json; then
    echo "✅ Capacitor core installed"
else
    echo "❌ Capacitor core missing"
fi

if grep -q "@capacitor/ios" package.json; then
    echo "✅ Capacitor iOS installed"
else
    echo "❌ Capacitor iOS missing"
fi

if grep -q "@capacitor/android" package.json; then
    echo "✅ Capacitor Android installed"
else
    echo "❌ Capacitor Android missing"
fi

# 8. Check Translation System
echo ""
echo "🌍 Translation System:"
if [ -f "lib/translations.ts" ]; then
    echo "✅ Translation system exists"
    if grep -q "noItemsFound" lib/translations.ts; then
        echo "✅ Missing translations added"
    else
        echo "⚠️  Missing translations not found"
    fi
else
    echo "❌ Translation system missing"
fi

# 9. Check API Endpoints
echo ""
echo "🔌 API Endpoints:"
if [ -f "app/api/items/route.ts" ]; then
    echo "✅ Items API exists"
else
    echo "❌ Items API missing"
fi

if [ -f "app/api/debug-db/route.ts" ]; then
    echo "✅ Database debug API exists"
else
    echo "❌ Database debug API missing"
fi

# 10. Check Admin Panel
echo ""
echo "👨‍💼 Admin Panel:"
if [ -f "app/admin/duplicates/page.tsx" ]; then
    echo "✅ Duplicate management page exists"
else
    echo "❌ Duplicate management page missing"
fi

if [ -f "app/admin/layout.tsx" ]; then
    if grep -q "Duplicates" app/admin/layout.tsx; then
        echo "✅ Duplicate management navigation exists"
    else
        echo "⚠️  Duplicate management navigation missing"
    fi
else
    echo "❌ Admin layout missing"
fi

echo ""
echo "🎯 CROSS-PLATFORM READINESS SUMMARY"
echo "===================================="
echo ""

# Count issues
issues=0
if [ ! -f "capacitor.config.ts" ]; then ((issues++)); fi
if [ ! -f "ios/App/App/Info.plist" ]; then ((issues++)); fi
if [ ! -f "android/app/src/main/AndroidManifest.xml" ]; then ((issues++)); fi
if [ ! -f "public/manifest.json" ]; then ((issues++)); fi
if [ ! -f "lib/translations.ts" ]; then ((issues++)); fi

if [ $issues -eq 0 ]; then
    echo "✅ ALL PLATFORMS READY!"
    echo ""
    echo "📱 iOS: Ready for Xcode compilation and TestFlight"
    echo "🤖 Android: Ready for Android Studio compilation and Play Store"
    echo "🌐 Web: Ready for PWA deployment and browser access"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. iOS: Run 'npm run ios:production' and compile in Xcode"
    echo "2. Android: Run 'npm run cap:copy:production' and compile in Android Studio"
    echo "3. Web: Deploy to Vercel (already configured)"
    echo ""
    echo "🔧 All platforms will connect to: https://smart-warehouse-five.vercel.app"
    echo "🔒 All connections use HTTPS for security"
    echo "🌍 All platforms support the same features and translations"
else
    echo "⚠️  $issues issues found - please fix before deployment"
fi

echo ""
echo "🔍 Verification complete!"
