#!/bin/bash

# Script to ensure Vercel and Supabase are up to date
# This script checks migration status and ensures Prisma client is regenerated

set -e

echo "🔄 Syncing Vercel and Supabase..."
echo ""

# 1. Check Prisma migration status
echo "📊 Checking Prisma migration status..."
npx prisma migrate status || echo "⚠️  Migration status check completed (some migrations may need manual application)"

echo ""
echo "🔧 Regenerating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Prisma Client regenerated"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. ✅ Prisma Client: Regenerated"
echo ""
echo "2. 🔍 Supabase Migration Check:"
echo "   - Go to Supabase Dashboard → SQL Editor"
echo "   - Run: scripts/verify-workflow-template-and-household-migration.sql"
echo "   - If migration not applied, run: prisma/migrations/make-workflow-template-type-optional-and-add-household.sql"
echo ""
echo "3. 🚀 Vercel Deployment:"
echo "   - Latest commits have been pushed to main branch"
echo "   - Vercel should auto-deploy on push"
echo "   - Check Vercel dashboard for deployment status"
echo ""
echo "4. 🔐 Environment Variables:"
echo "   - Ensure DATABASE_URL is set in Vercel"
echo "   - Ensure NEXT_PUBLIC_SUPABASE_URL is set in Vercel"
echo "   - Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in Vercel"
echo ""
echo "✨ Sync check complete!"
