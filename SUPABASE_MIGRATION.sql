-- ============================================
-- SUPABASE MIGRATION SQL
-- Run this directly in Supabase SQL Editor
-- ============================================
-- 
-- Instructions:
-- 1. Go to: https://supabase.com/dashboard
-- 2. Select your project: ddvjegjzxjaetpaptjlo
-- 3. Click "SQL Editor" in left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste ALL the SQL below
-- 6. Click "Run" (or press Cmd/Ctrl + Enter)
--
-- ============================================

-- Add photos field to maintenance_tickets table
-- This allows maintenance tickets to include photo attachments
ALTER TABLE maintenance_tickets 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN maintenance_tickets.photos IS 'Array of photo URLs or base64 strings attached to the maintenance ticket';

-- Optional: Add index for better query performance (uncomment if needed)
-- CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_photos ON maintenance_tickets USING GIN (photos);

-- ============================================
-- VERIFICATION QUERY
-- Run this after the migration to verify the column was added:
-- ============================================
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'maintenance_tickets' 
-- AND column_name = 'photos';

