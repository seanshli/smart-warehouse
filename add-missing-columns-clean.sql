ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "buy_date" TIMESTAMP;

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "buy_cost" REAL;

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "buy_location" TEXT;

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "invoice_number" TEXT;

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS "seller_name" TEXT;

CREATE INDEX IF NOT EXISTS idx_items_buy_date ON items("buy_date");
CREATE INDEX IF NOT EXISTS idx_items_invoice_number ON items("invoice_number");
CREATE INDEX IF NOT EXISTS idx_items_seller_name ON items("seller_name");

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items' 
AND column_name IN ('buy_date', 'buy_cost', 'buy_location', 'invoice_number', 'seller_name')
ORDER BY column_name;
