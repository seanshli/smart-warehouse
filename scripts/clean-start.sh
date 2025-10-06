#!/bin/bash

echo "🧹 Cleaning up all servers and processes..."

# Kill all Next.js processes
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "node.*next" 2>/dev/null || true

# Kill processes on ports 3000-3010
for port in {3000..3010}; do
  lsof -ti :$port | xargs kill -9 2>/dev/null || true
done

sleep 2

# Clear Next.js cache
echo "🗑️  Removing cache..."
rm -rf .next

echo "✅ Cleanup complete!"
echo ""
echo "🚀 Starting fresh server..."
cd /Users/seanli/Library/CloudStorage/Dropbox/EE/enGo/SW/cursor
npm run dev

