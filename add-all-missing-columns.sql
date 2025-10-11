-- Add all remaining missing columns to items table
-- This fixes multiple "column does not exist" errors

-- Add buy_date column (Taiwan invoice field)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "buy_date" TIMESTAMP;

-- Add buy_cost column (Taiwan invoice field)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "buy_cost" REAL;

-- Add buy_location column (Taiwan invoice field)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "buy_location" TEXT;

-- Add invoice_number column (Taiwan invoice field)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "invoice_number" TEXT;

-- Add seller_name column (Taiwan invoice field)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "seller_name" TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_buy_date ON items("buy_date");
CREATE INDEX IF NOT EXISTS idx_items_invoice_number ON items("invoice_number");
CREATE INDEX IF NOT EXISTS idx_items_seller_name ON items("seller_name");

-- Verify all columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items' 
AND column_name IN ('buy_date', 'buy_cost', 'buy_location', 'invoice_number', 'seller_name')
ORDER BY column_name;
