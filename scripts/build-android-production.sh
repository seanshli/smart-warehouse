#!/bin/bash

# Android Production Build Script for Google Play Store Deployment
# This script prepares the Android app for Google Play Store submission

echo "🚀 Building Android app for Google Play Store deployment..."

# Set environment variables for production
export CAP_SERVER_URL="https://smart-warehouse-five.vercel.app"

# Navigate to project root
cd "$(dirname "$0")/.."

echo "📱 Building Next.js app for production..."
npm run build

echo "🔄 Syncing Capacitor..."
npx cap sync android

echo "📦 Building Android app for release..."
cd android

# Clean build
./gradlew clean

# Build release APK
echo "🏗️ Building release APK..."
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo "✅ Android APK built successfully!"
    echo "📁 APK location: android/app/build/outputs/apk/release/app-release.apk"
    echo "📤 Ready for Google Play Console upload"
    echo ""
    echo "Next steps:"
    echo "1. Go to Google Play Console"
    echo "2. Create a new app or select existing app"
    echo "3. Go to Production > Releases"
    echo "4. Upload the APK file"
    echo "5. Fill in release details and publish"
else
    echo "❌ Android build failed!"
    echo "💡 Make sure you have Java JDK installed and configured"
    exit 1
fi
