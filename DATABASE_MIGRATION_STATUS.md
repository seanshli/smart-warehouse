# Database Migration Status

## Schema Changes Required

### ChatHistory Table
- **Status**: ⚠️ **NOT APPLIED YET**
- **Migration File**: `prisma/migrations/add_chat_history_and_call_auto_reject.sql`
- **Location**: Standalone SQL file (not in proper migration folder)

### CallSession Updates
- **Status**: ⚠️ **NOT APPLIED YET**
- **Changes**:
  - Add `household_id` column
  - Add `target_household_id` column
  - Add `rejection_reason` column
  - Make `conversation_id` nullable

## Migration Status

### Current State
- Migration SQL file exists: ✅ `prisma/migrations/add_chat_history_and_call_auto_reject.sql`
- Migration NOT run: ❌ (file is standalone, not in proper migration folder)
- Database tables: ❌ ChatHistory table does not exist
- CallSession columns: ❌ New columns not added

### Why Migration Not Applied
1. **Migration file location**: File is in `prisma/migrations/` but not in a proper migration folder (should be `YYYYMMDDHHMMSS_migration_name/`)
2. **Prisma migrate status**: Cannot check because DATABASE_URL not loaded in CLI
3. **Manual execution needed**: SQL file exists but needs to be run manually or via proper Prisma migration

## How to Apply Migration

### Option 1: Run Migration Script (Recommended)
```bash
./scripts/run-migration.sh
```

This will:
1. Load DATABASE_URL from `.env.local`
2. Run the migration SQL file
3. Create ChatHistory table
4. Update CallSession table

### Option 2: Manual SQL Execution
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `prisma/migrations/add_chat_history_and_call_auto_reject.sql`
3. Paste and execute

### Option 3: Proper Prisma Migration
```bash
# Create proper migration folder structure
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_chat_history_and_call_auto_reject
mv prisma/migrations/add_chat_history_and_call_auto_reject.sql prisma/migrations/$(date +%Y%m%d%H%M%S)_add_chat_history_and_call_auto_reject/migration.sql

# Then run migration
export $(cat .env.local | grep DATABASE_URL | xargs)
npx prisma migrate deploy
```

## Verification

After migration, verify:
```sql
-- Check ChatHistory table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'chat_history'
);

-- Check CallSession columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'call_sessions' 
AND column_name IN ('household_id', 'target_household_id', 'rejection_reason');
```

## Summary

**Status**: ⚠️ **MIGRATION NEEDED**

- Schema changes defined: ✅
- Migration file created: ✅
- Migration applied: ❌ **NOT YET**
- Action required: Run migration script or execute SQL manually
