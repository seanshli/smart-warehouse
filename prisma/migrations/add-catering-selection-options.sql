-- Add selection options to catering order items
ALTER TABLE "catering_order_items"
ADD COLUMN IF NOT EXISTS "is_vegetarian" BOOLEAN DEFAULT false;

ALTER TABLE "catering_order_items"
ADD COLUMN IF NOT EXISTS "spice_level" TEXT DEFAULT 'no';

-- Add comment explaining spice level values
COMMENT ON COLUMN "catering_order_items"."spice_level" IS 'no, 1x pepper, 2x pepper, 3x pepper';
