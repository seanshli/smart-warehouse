#!/bin/bash

# Increment Version and Build Numbers for iOS/Android Deployment
# This script increments version numbers, syncs Capacitor, and prepares for deployment

set -e

echo "🚀 Smart Warehouse - Increment Version & Prepare Deployment"
echo "============================================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current Version: $CURRENT_VERSION"

# Parse version components
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Increment patch version
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

echo "✨ New Version: $NEW_VERSION"
echo ""

# Get current Android versionCode
ANDROID_VERSION_CODE=$(grep -A 1 "versionCode" android/app/build.gradle | grep "versionCode" | awk '{print $2}')
echo "🤖 Current Android versionCode: $ANDROID_VERSION_CODE"

# Increment Android versionCode
NEW_ANDROID_VERSION_CODE=$((ANDROID_VERSION_CODE + 1))
echo "✨ New Android versionCode: $NEW_ANDROID_VERSION_CODE"
echo ""

# Get current iOS CURRENT_PROJECT_VERSION
IOS_BUILD_NUMBER=$(grep "CURRENT_PROJECT_VERSION" ios/App/App.xcodeproj/project.pbxproj | head -1 | sed 's/.*CURRENT_PROJECT_VERSION = \([0-9]*\);.*/\1/')
echo "🍎 Current iOS CURRENT_PROJECT_VERSION: $IOS_BUILD_NUMBER"

# Increment iOS build number
NEW_IOS_BUILD_NUMBER=$((IOS_BUILD_NUMBER + 1))
echo "✨ New iOS CURRENT_PROJECT_VERSION: $NEW_IOS_BUILD_NUMBER"
echo ""

# Confirm before proceeding
read -p "Continue with version increment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "📝 Updating version numbers..."

# Update package.json
echo "  • Updating package.json..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Update Android build.gradle
echo "  • Updating Android build.gradle..."
sed -i '' "s/versionCode $ANDROID_VERSION_CODE/versionCode $NEW_ANDROID_VERSION_CODE/g" android/app/build.gradle
sed -i '' "s/versionName \"$CURRENT_VERSION\"/versionName \"$NEW_VERSION\"/g" android/app/build.gradle

# Update iOS project.pbxproj
echo "  • Updating iOS project.pbxproj..."
sed -i '' "s/CURRENT_PROJECT_VERSION = $IOS_BUILD_NUMBER;/CURRENT_PROJECT_VERSION = $NEW_IOS_BUILD_NUMBER;/g" ios/App/App.xcodeproj/project.pbxproj
sed -i '' "s/MARKETING_VERSION = $CURRENT_VERSION;/MARKETING_VERSION = $NEW_VERSION;/g" ios/App/App.xcodeproj/project.pbxproj

echo "✅ Version numbers updated!"
echo ""

# Build Next.js app
echo "📦 Building Next.js app for production..."
npm run build:production
if [ $? -ne 0 ]; then
    echo "❌ Next.js build failed"
    exit 1
fi
echo "✅ Next.js build complete"
echo ""

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap copy
if [ $? -ne 0 ]; then
    echo "❌ Capacitor copy failed"
    exit 1
fi
echo "✅ Capacitor copy complete"
echo ""

# Sync iOS
echo "🍎 Syncing iOS..."
npx cap sync ios
if [ $? -ne 0 ]; then
    echo "❌ iOS sync failed"
    exit 1
fi
echo "✅ iOS sync complete"
echo ""

# Sync Android
echo "🤖 Syncing Android..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "❌ Android sync failed"
    exit 1
fi
echo "✅ Android sync complete"
echo ""

# Summary
echo "🎉 Version Increment & Sync Complete!"
echo "======================================"
echo ""
echo "📊 Version Summary:"
echo "  • Package Version: $NEW_VERSION (was $CURRENT_VERSION)"
echo "  • Android versionCode: $NEW_ANDROID_VERSION_CODE (was $ANDROID_VERSION_CODE)"
echo "  • Android versionName: $NEW_VERSION"
echo "  • iOS CURRENT_PROJECT_VERSION: $NEW_IOS_BUILD_NUMBER (was $IOS_BUILD_NUMBER)"
echo "  • iOS MARKETING_VERSION: $NEW_VERSION"
echo ""
echo "📱 Next Steps:"
echo ""
echo "🍎 iOS Deployment:"
echo "  1. Open Xcode: npx cap open ios"
echo "  2. Product → Archive"
echo "  3. Distribute App → App Store Connect"
echo "  4. Upload to TestFlight/App Store"
echo ""
echo "🤖 Android Deployment:"
echo "  1. Open Android Studio: npx cap open android"
echo "  2. Build → Generate Signed Bundle / APK"
echo "  3. Upload to Google Play Console"
echo ""
echo "🌐 Web Deployment:"
echo "  • Git commit and push (Vercel auto-deploys)"
echo ""
echo "💡 To commit these changes:"
echo "  git add package.json android/app/build.gradle ios/App/App.xcodeproj/project.pbxproj"
echo "  git commit -m \"Bump version to $NEW_VERSION (iOS build $NEW_IOS_BUILD_NUMBER, Android build $NEW_ANDROID_VERSION_CODE)\""
echo "  git push"
echo ""
