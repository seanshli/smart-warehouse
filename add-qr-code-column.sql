-- Add missing columns to items table
-- This fixes the "column items.qrCode does not exist" error and other missing columns

-- Add qrCode column
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "qrCode" TEXT;

-- Add imageUrl column  
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Add aiDescription column
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "aiDescription" TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_qrcode ON items("qrCode");
CREATE INDEX IF NOT EXISTS idx_items_imageurl ON items("imageUrl");

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items' 
AND column_name IN ('qrCode', 'imageUrl', 'aiDescription')
ORDER BY column_name;
