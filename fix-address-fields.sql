-- Add additional address fields to households table
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "street_address" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "building_address" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "telephone" TEXT;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'households' 
AND column_name IN ('street_address', 'building_address', 'telephone')
ORDER BY column_name;
