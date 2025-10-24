#!/bin/bash

# iOS Production Build Script for App Store Deployment
# This script prepares the iOS app for App Store submission

echo "🚀 Building iOS app for App Store deployment..."

# Set environment variables for production
export LANG=en_US.UTF-8
export CAP_SERVER_URL="https://smart-warehouse-five.vercel.app"

# Navigate to project root
cd "$(dirname "$0")/.."

echo "📱 Building Next.js app for production..."
npm run build

echo "🔄 Syncing Capacitor..."
npx cap sync ios

echo "📦 Building iOS app for release..."
cd ios/App

# Clean build folder
xcodebuild clean -workspace App.xcworkspace -scheme App

# Build for release (Archive)
echo "🏗️ Building archive for App Store..."
xcodebuild archive \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination generic/platform=iOS \
  -archivePath ../App.xcarchive \
  CODE_SIGN_IDENTITY="Apple Distribution" \
  DEVELOPMENT_TEAM="M358UZHL82" \
  PROVISIONING_PROFILE_SPECIFIER=""

if [ $? -eq 0 ]; then
    echo "✅ iOS archive created successfully!"
    echo "📁 Archive location: ios/App.xcarchive"
    echo "📤 Ready for App Store Connect upload via Xcode Organizer"
    echo ""
    echo "Next steps:"
    echo "1. Open Xcode"
    echo "2. Go to Window > Organizer"
    echo "3. Select your archive and click 'Distribute App'"
    echo "4. Choose 'App Store Connect'"
    echo "5. Follow the upload wizard"
else
    echo "❌ iOS build failed!"
    exit 1
fi

