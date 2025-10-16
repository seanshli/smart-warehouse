#!/bin/bash

# Build production mobile app with correct Vercel configuration
echo "🚀 Building Smart Warehouse for Production Mobile App..."
echo "========================================================"

# Set production environment
export NODE_ENV=production
export CAP_SERVER_URL="https://smart-warehouse-five.vercel.app"

echo "📍 Production URL: $CAP_SERVER_URL"
echo "🔧 Environment: $NODE_ENV"

# Build the app
echo "📦 Building Next.js app..."
npm run build:production

# Copy to Capacitor
echo "📱 Copying to Capacitor..."
npx cap copy

# Open iOS project
echo "🍎 Opening iOS project in Xcode..."
npx cap open ios

echo ""
echo "✅ Production mobile app build complete!"
echo "========================================"
echo "📱 The app will now connect to: https://smart-warehouse-five.vercel.app"
echo "🔒 Using HTTPS for secure connections"
echo "🌍 Accessible from any network worldwide"
echo ""
echo "📋 Next steps in Xcode:"
echo "1. Build the project (Cmd+B)"
echo "2. Run on device or simulator"
echo "3. Test from different networks"
echo ""
echo "⚠️  Make sure to:"
echo "- Test on different WiFi networks"
echo "- Test on mobile data"
echo "- Verify all features work correctly"
