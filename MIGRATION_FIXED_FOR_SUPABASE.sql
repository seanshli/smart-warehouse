-- Migration: Add ChatHistory table and update CallSession for auto-reject
-- Run this directly in Supabase SQL Editor
-- FIXED: Creates call_sessions table if it doesn't exist
-- Date: 2025-01-XX

-- ============================================
-- STEP 1: Create call_sessions table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS call_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  initiator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL DEFAULT 'audio',
  status TEXT NOT NULL DEFAULT 'ringing',
  started_at TIMESTAMP WITH TIME ZONE,
  answered_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: Add new columns to call_sessions
-- ============================================
ALTER TABLE call_sessions 
  ADD COLUMN IF NOT EXISTS household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS target_household_id TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ============================================
-- STEP 3: Make conversation_id nullable (safe check)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_sessions' 
    AND column_name = 'conversation_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE call_sessions ALTER COLUMN conversation_id DROP NOT NULL;
  END IF;
END $$;

-- ============================================
-- STEP 4: Create ChatHistory table
-- ============================================
CREATE TABLE IF NOT EXISTS chat_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
  target_household_id TEXT,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_type TEXT NOT NULL, -- 'household' | 'frontdesk' | 'frontdoor' | 'visitor'
  receiver_id TEXT,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text' | 'image' | 'file' | 'system'
  format TEXT NOT NULL DEFAULT 'text', -- 'text', 'markdown', 'html', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 5: Create indexes for ChatHistory
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chat_history_conversation_id ON chat_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_household_id ON chat_history(household_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_target_household_id ON chat_history(target_household_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_sender_id ON chat_history(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_receiver_type_id ON chat_history(receiver_type, receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- ============================================
-- STEP 6: Create indexes for CallSession
-- ============================================
CREATE INDEX IF NOT EXISTS idx_call_sessions_conversation_id ON call_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_household_id ON call_sessions(household_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_target_household_id ON call_sessions(target_household_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_initiator_id ON call_sessions(initiator_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status_created_at ON call_sessions(status, created_at);

-- ============================================
-- VERIFICATION (run these after migration)
-- ============================================
-- Check tables exist:
-- SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_history');
-- SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'call_sessions');

-- Check call_sessions columns:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'call_sessions' 
-- ORDER BY ordinal_position;

-- Check chat_history columns:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'chat_history' 
-- ORDER BY ordinal_position;
