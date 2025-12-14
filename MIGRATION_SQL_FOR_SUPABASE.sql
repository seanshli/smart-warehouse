-- Migration: Add ChatHistory table and update CallSession for auto-reject
-- Run this directly in Supabase SQL Editor
-- Date: 2025-01-XX

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
  receiver_type TEXT NOT NULL, -- 'household' | 'frontdesk' | 'frontdoor' | 'visitor'
  receiver_id TEXT,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text' | 'image' | 'file' | 'system'
  format TEXT NOT NULL DEFAULT 'text', -- 'text', 'markdown', 'html', etc.
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

-- Verification queries (run these after migration to verify)
-- SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_history');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'call_sessions' AND column_name IN ('household_id', 'target_household_id', 'rejection_reason');
