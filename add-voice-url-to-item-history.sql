-- Migration: Add voice_url column to item_history table
-- This migration adds support for voice comments in item history

-- Add voice_url column to item_history table
ALTER TABLE item_history 
ADD COLUMN IF NOT EXISTS voice_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN item_history.voice_url IS 'Base64-encoded audio data URL for voice comments (format: data:audio/webm;codecs=opus;base64,...)';

