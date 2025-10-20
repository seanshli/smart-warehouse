#!/bin/bash

# Smart Warehouse Mobile App Preparation Script
# This script prepares the app for Android and iOS deployment

set -e

echo "🚀 Preparing Smart Warehouse for mobile deployment..."

# Set UTF-8 encoding for CocoaPods
export LANG=en_US.UTF-8

# Build the Next.js app
echo "📦 Building Next.js application..."
npm run build

# Sync Capacitor platforms
echo "🔄 Syncing Capacitor platforms..."
npx cap sync

# Android preparation
echo "🤖 Preparing Android build..."
if [ -d "android" ]; then
    echo "✅ Android platform found"
    echo "📱 To build Android APK/AAB:"
    echo "   cd android && ./gradlew assembleRelease"
    echo "   cd android && ./gradlew bundleRelease"
else
    echo "❌ Android platform not found. Run: npx cap add android"
fi

# iOS preparation
echo "🍎 Preparing iOS build..."
if [ -d "ios" ]; then
    echo "✅ iOS platform found"
    echo "📱 To build iOS app:"
    echo "   npx cap open ios"
    echo "   Then use Xcode to archive and upload to TestFlight"
else
    echo "❌ iOS platform not found. Run: npx cap add ios"
fi

# Check Capacitor status
echo "🔍 Checking Capacitor status..."
npx cap doctor

echo "✅ Mobile preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Android: Open Android Studio and build APK/AAB"
echo "2. iOS: Open Xcode workspace and archive for TestFlight"
echo "3. Test on real devices before publishing"
echo ""
echo "🌐 Web version is ready at: https://smart-warehouse-five.vercel.app"
