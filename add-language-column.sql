-- Add missing language column to items table
-- This fixes the "column items.language does not exist" error

-- Add language column
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "language" TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_items_language ON items("language");

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items' 
AND column_name = 'language';
