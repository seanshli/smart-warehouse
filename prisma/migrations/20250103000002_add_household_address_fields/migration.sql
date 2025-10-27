-- Add additional address fields to households table
ALTER TABLE "households" ADD COLUMN "street_address" TEXT;
ALTER TABLE "households" ADD COLUMN "building_address" TEXT;
ALTER TABLE "households" ADD COLUMN "telephone" TEXT;
