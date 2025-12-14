-- Verification Queries for Migration
-- Run these in Supabase SQL Editor to verify migration success

-- ============================================
-- STEP 1: Check if tables exist
-- ============================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'call_sessions', 'chat_history')
ORDER BY table_name;

-- Expected: 3 rows returned
-- conversations
-- call_sessions
-- chat_history

-- ============================================
-- STEP 2: Check call_sessions columns
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'call_sessions' 
AND column_name IN ('household_id', 'target_household_id', 'rejection_reason', 'conversation_id')
ORDER BY column_name;

-- Expected: 4 rows returned
-- conversation_id | text | YES (nullable)
-- household_id | text | YES (nullable)
-- rejection_reason | text | YES (nullable)
-- target_household_id | text | YES (nullable)

-- ============================================
-- STEP 3: Check chat_history columns
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_history' 
ORDER BY ordinal_position;

-- Expected: Multiple columns including:
-- id, conversation_id, household_id, target_household_id, sender_id, 
-- receiver_type, receiver_id, content, message_type, format, created_at

-- ============================================
-- STEP 4: Check indexes
-- ============================================
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('conversations', 'call_sessions', 'chat_history')
ORDER BY tablename, indexname;

-- Expected: Multiple indexes for each table

-- ============================================
-- STEP 5: Quick count check
-- ============================================
SELECT 
  (SELECT COUNT(*) FROM conversations) as conversations_count,
  (SELECT COUNT(*) FROM call_sessions) as call_sessions_count,
  (SELECT COUNT(*) FROM chat_history) as chat_history_count;

-- Expected: All counts should be 0 or more (0 is fine for new tables)
