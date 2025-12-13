#!/bin/bash

# Script to run Prisma migration with proper environment setup

echo "🔧 Setting up environment for Prisma migration..."

# Load .env.local if it exists
if [ -f .env.local ]; then
  echo "📄 Loading .env.local..."
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Load .env if it exists
if [ -f .env ]; then
  echo "📄 Loading .env..."
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not found!"
  echo ""
  echo "Please set DATABASE_URL in one of these ways:"
  echo "1. Create .env.local file with: DATABASE_URL=\"your-connection-string\""
  echo "2. Or export it: export DATABASE_URL=\"your-connection-string\""
  echo ""
  echo "Example from supabase-config.env:"
  echo "DATABASE_URL=\"postgresql://postgres:Smtengo1324@db.ddvjegjzxjaetpaptjlo.supabase.co:5432/postgres\""
  exit 1
fi

echo "✅ DATABASE_URL found"
echo "🚀 Running Prisma migration..."

# Run the migration
npx prisma migrate dev --name add_chat_history_and_call_auto_reject

echo "✅ Migration complete!"
