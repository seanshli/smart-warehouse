# Complete Migration Guide - Run in Supabase SQL Editor

## ✅ **READY TO RUN**

The migration has been **FIXED** to handle all missing tables. Use this file: **`MIGRATION_FIXED_FOR_SUPABASE.sql`**

## What the Migration Does

### Creates Tables (if they don't exist):
1. ✅ **conversations** - Chat conversations between front desk/admin and households
2. ✅ **call_sessions** - Video/audio call sessions
3. ✅ **chat_history** - Admin viewable chat message history

### Updates Tables:
- Adds columns to `call_sessions`:
  - `household_id` - For household-to-household calls
  - `target_household_id` - Target household for direct calls
  - `rejection_reason` - Reason for auto-rejected calls
- Makes `conversation_id` nullable in `call_sessions`

### Creates Indexes:
- All necessary indexes for performance

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor
- Go to: https://supabase.com/dashboard
- Select project: `ddvjegjzxjaetpaptjlo`
- Click **"SQL Editor"** → **"New Query"**

### 2. Copy Migration SQL
Open file: **`MIGRATION_FIXED_FOR_SUPABASE.sql`**
- Copy **ALL** contents (entire file)

### 3. Paste and Run
- Paste into SQL Editor
- Click **"Run"** button (or Cmd/Ctrl + Enter)
- Wait for completion

### 4. Verify Success
Run these verification queries:

```sql
-- Check all tables exist
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations');
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'call_sessions');
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_history');

-- Check call_sessions columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'call_sessions' 
AND column_name IN ('household_id', 'target_household_id', 'rejection_reason', 'conversation_id')
ORDER BY column_name;

-- Check chat_history columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_history' 
ORDER BY ordinal_position;
```

## Expected Results

After running migration:
- ✅ `conversations` table created
- ✅ `call_sessions` table created (or updated if exists)
- ✅ `chat_history` table created
- ✅ All columns added
- ✅ All indexes created
- ✅ Foreign key constraints added

## Troubleshooting

### If you see errors:

1. **"relation X does not exist"**:
   - The migration creates all tables first
   - Make sure you copied the ENTIRE file
   - Run from beginning to end

2. **"constraint already exists"**:
   - Safe to ignore - means constraint already added
   - Migration uses `IF NOT EXISTS` for safety

3. **"column already exists"**:
   - Safe to ignore - means column already added
   - Migration uses `IF NOT EXISTS` for safety

## After Migration

### Regenerate Prisma Client
```bash
npx prisma generate
```

### Test the Changes
- Try creating a reservation (should work)
- Try making a call (should work)
- Check admin chat history page (should show messages)

## Summary

**File to Use**: `MIGRATION_FIXED_FOR_SUPABASE.sql`

**Time**: ~30 seconds to execute

**Risk**: Low (uses `IF NOT EXISTS` - safe to run multiple times)

**Status**: ✅ **READY TO RUN**
