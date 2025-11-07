-- Migration: Add voice_transcript column to item_history table
-- This migration adds speech-to-text transcription support for voice comments

-- Add voice_transcript column to item_history table
ALTER TABLE item_history 
ADD COLUMN IF NOT EXISTS voice_transcript TEXT;

-- Add comment to document the column
COMMENT ON COLUMN item_history.voice_transcript IS 'Transcribed text from voice comments using OpenAI Whisper API. Makes voice comments searchable.';

