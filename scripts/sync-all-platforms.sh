#!/bin/bash

# Sync All Platforms Script
# Ensures GitHub sync for web/iOS/Android and prepares for build

set -e

echo "🔄 Syncing All Platforms (Web/iOS/Android)"
echo "=========================================="
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Check git status
echo "📋 Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: Uncommitted changes detected"
    echo "   Files:"
    git status --short
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled"
        exit 1
    fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current Version: $CURRENT_VERSION"
echo ""

# Build Next.js for production
echo "🌐 Building Web App..."
npm run build:production
if [ $? -ne 0 ]; then
    echo "❌ Web build failed"
    exit 1
fi
echo "✅ Web build complete"
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

# Check git status again
echo "📋 Final Git status..."
git status --short

echo ""
echo "🎉 Platform Sync Complete!"
echo "=========================="
echo ""
echo "📊 Summary:"
echo "  • Version: $CURRENT_VERSION"
echo "  • Web: Built and ready"
echo "  • iOS: Synced"
echo "  • Android: Synced"
echo ""
echo "✅ Ready for GitHub push and builds!"
