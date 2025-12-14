# Run Migration Directly in Supabase SQL Editor

## ✅ **RECOMMENDED: Direct SQL Execution**

Since the migration file is standalone (not in proper Prisma migration folder structure), **running it directly in Supabase SQL Editor is simpler and more direct**.

## Steps to Run Migration

### 1. Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select project: `ddvjegjzxjaetpaptjlo`
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**

### 2. Copy Migration SQL
Copy the entire contents of: `prisma/migrations/add_chat_history_and_call_auto_reject.sql`

### 3. Paste and Execute
1. Paste the SQL into the editor
2. Click **"Run"** button (or press Cmd/Ctrl + Enter)

### 4. Verify Success
You should see:
- ✅ "Success. No rows returned"
- Or check tables exist:
  ```sql
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_history');
  ```

## Migration SQL Content

```sql
-- Update CallSession table to support household-to-household calls and auto-reject
ALTER TABLE call_sessions 
  ADD COLUMN IF NOT EXISTS household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS target_household_id TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update conversation_id to be nullable (for household-to-household calls)
ALTER TABLE call_sessions 
  ALTER COLUMN conversation_id DROP NOT NULL;

-- Create ChatHistory table for admin viewing
CREATE TABLE IF NOT EXISTS chat_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
  target_household_id TEXT,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_type TEXT NOT NULL,
  receiver_id TEXT,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  format TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ChatHistory
CREATE INDEX IF NOT EXISTS idx_chat_history_conversation_id ON chat_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_household_id ON chat_history(household_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_target_household_id ON chat_history(target_household_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_sender_id ON chat_history(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_receiver_type_id ON chat_history(receiver_type, receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- Create indexes for CallSession updates
CREATE INDEX IF NOT EXISTS idx_call_sessions_household_id ON call_sessions(household_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_target_household_id ON call_sessions(target_household_id);
```

## Why Direct SQL is Better Here

1. ✅ **Simpler**: No need to set up Prisma migration environment
2. ✅ **Faster**: Immediate execution
3. ✅ **Safe**: Uses `IF NOT EXISTS` - can run multiple times safely
4. ✅ **Direct**: See results immediately in Supabase dashboard
5. ✅ **No CLI issues**: Avoids DATABASE_URL environment variable issues

## After Running Migration

### Verify Tables Created
```sql
-- Check ChatHistory table
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_history'
ORDER BY ordinal_position;

-- Check CallSession columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'call_sessions' 
AND column_name IN ('household_id', 'target_household_id', 'rejection_reason', 'conversation_id');
```

### Update Prisma Client
After migration, regenerate Prisma client:
```bash
npx prisma generate
```

## Summary

**Recommended Approach**: ✅ **Run directly in Supabase SQL Editor**

**Why**: 
- Migration file is standalone SQL (not in proper Prisma migration folder)
- Uses safe `IF NOT EXISTS` clauses
- More direct and immediate
- Avoids Prisma CLI environment setup issues

**Time**: ~30 seconds to execute

**Risk**: Low (uses `IF NOT EXISTS` - safe to run multiple times)
