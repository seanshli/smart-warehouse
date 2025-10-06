#!/bin/bash

echo "🔄 Resetting Smart Warehouse Server..."

# Kill any existing Next.js processes
echo "⏹️  Stopping existing server..."
pkill -f "next dev" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Clear Next.js cache
echo "🧹 Clearing cache..."
rm -rf .next 2>/dev/null || true

# Start fresh server
echo "🚀 Starting fresh server..."
npm run dev

