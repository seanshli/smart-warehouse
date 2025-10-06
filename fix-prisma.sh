#!/bin/bash

echo "🔧 Fixing Prisma client generation..."

# Navigate to project directory
cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm install

echo "🗑️  Cleaning Prisma cache..."
rm -rf node_modules/.prisma
rm -rf prisma/dev.db*

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🗄️  Pushing database schema..."
npx prisma db push

echo "✅ Prisma setup complete!"
echo ""
echo "🚀 You can now run: npm run dev"

