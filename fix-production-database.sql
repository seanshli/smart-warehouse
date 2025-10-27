-- Fix production database schema
-- This script adds the missing columns to the households table

-- Add location fields to households table
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "community" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "apartment_no" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "address" TEXT;

-- Add tags field to items table
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'households' 
AND column_name IN ('country', 'city', 'district', 'community', 'apartment_no', 'latitude', 'longitude', 'address')
ORDER BY column_name;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items' 
AND column_name = 'tags';
