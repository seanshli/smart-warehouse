#!/bin/bash

# Fix Local Login Issues
# This script clears Prisma cache and regenerates the client

echo "🔧 Fixing Local Login Issues..."
echo ""

# Step 1: Stop any running dev server
echo "📋 Step 1: Checking for running processes..."
if pgrep -f "next dev" > /dev/null; then
    echo "⚠️  Development server is running. Please stop it first (Ctrl+C)."
    echo "   Then run this script again."
    exit 1
fi

# Step 2: Clear Prisma cache
echo "📋 Step 2: Clearing Prisma cache..."
rm -rf node_modules/.prisma
echo "✅ Cleared Prisma cache"

# Step 3: Clear Next.js cache
echo "📋 Step 3: Clearing Next.js cache..."
rm -rf .next
echo "✅ Cleared Next.js cache"

# Step 4: Regenerate Prisma client
echo "📋 Step 4: Regenerating Prisma client..."
npx prisma generate
echo "✅ Regenerated Prisma client"

# Step 5: Verify environment variables
echo ""
echo "📋 Step 5: Checking environment variables..."
if [ -f .env.local ]; then
    if grep -q "DATABASE_URL" .env.local; then
        echo "✅ DATABASE_URL found in .env.local"
    else
        echo "⚠️  DATABASE_URL not found in .env.local"
        echo "   Please ensure .env.local contains:"
        echo "   DATABASE_URL=\"postgresql://postgres:Smtengo1324@db.ddvjegjzxjaetpaptjlo.supabase.co:5432/postgres\""
    fi
    
    if grep -q "NEXTAUTH_SECRET" .env.local; then
        echo "✅ NEXTAUTH_SECRET found in .env.local"
    else
        echo "⚠️  NEXTAUTH_SECRET not found in .env.local"
        echo "   Please add NEXTAUTH_SECRET to .env.local"
    fi
else
    echo "⚠️  .env.local file not found"
    echo "   Please create .env.local with required environment variables"
fi

echo ""
echo "✅ Fix complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Ensure .env.local has correct DATABASE_URL and NEXTAUTH_SECRET"
echo "   2. Run: npm run dev"
echo "   3. Try logging in at: http://localhost:3000/auth/signin"
echo "   4. Check terminal logs for [auth] messages"

