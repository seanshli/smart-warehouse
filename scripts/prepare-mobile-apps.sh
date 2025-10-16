#!/bin/bash

# Smart Warehouse Mobile App Preparation Script
# This script prepares both iOS and Android apps for distribution

set -e

echo "🚀 Preparing Smart Warehouse Mobile Apps for Distribution"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "📋 Checking prerequisites..."

# Check for required tools
if ! command_exists node; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Check for Capacitor CLI
if ! command_exists npx; then
    echo "❌ npx is not available"
    exit 1
fi

echo "✅ npx is available"

echo ""
echo "🔧 Step 1: Installing dependencies..."
npm install

echo ""
echo "🏗️ Step 2: Building Next.js app for production..."
NODE_ENV=production npm run build

echo ""
echo "📱 Step 3: Copying web assets to mobile platforms..."
npx cap copy

echo ""
echo "🔄 Step 4: Syncing native projects..."
npx cap sync

echo ""
echo "📋 Step 5: Platform Status Check..."
echo "=================================="

# Check iOS
if [ -d "ios" ]; then
    echo "✅ iOS platform: Ready"
    echo "   📁 Location: ./ios/"
    echo "   🛠️  Open with: npm run ios:production"
else
    echo "❌ iOS platform: Not found"
fi

# Check Android
if [ -d "android" ]; then
    echo "✅ Android platform: Ready"
    echo "   📁 Location: ./android/"
    echo "   🛠️  Open with: npx cap open android"
else
    echo "❌ Android platform: Not found"
fi

echo ""
echo "🎯 Next Steps for Distribution:"
echo "=============================="

echo ""
echo "🍎 iOS Distribution:"
echo "1. Open Xcode: npm run ios:production"
echo "2. In Xcode:"
echo "   - Select 'App' scheme"
echo "   - Choose 'Any iOS Device' as target"
echo "   - Product → Archive"
echo "   - Follow TestFlight/App Store Connect workflow"
echo ""
echo "🤖 Android Distribution:"
echo "1. Open Android Studio: npx cap open android"
echo "2. In Android Studio:"
echo "   - Build → Generate Signed Bundle/APK"
echo "   - Choose Android App Bundle (.aab)"
echo "   - Upload to Google Play Console"
echo ""

echo "📝 Important Notes:"
echo "=================="
echo "• Make sure Vercel environment variables are set"
echo "• Test the app thoroughly before distribution"
echo "• Update app icons and splash screens if needed"
echo "• Check app permissions and privacy settings"
echo ""

echo "✅ Mobile app preparation complete!"
echo "Ready for iOS TestFlight and Android Play Store submission! 🎉"
