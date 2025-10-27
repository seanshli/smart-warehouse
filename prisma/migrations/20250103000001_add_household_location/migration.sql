-- Add location fields to households table
ALTER TABLE "households" ADD COLUMN "country" TEXT;
ALTER TABLE "households" ADD COLUMN "city" TEXT;
ALTER TABLE "households" ADD COLUMN "district" TEXT;
ALTER TABLE "households" ADD COLUMN "community" TEXT;
ALTER TABLE "households" ADD COLUMN "apartment_no" TEXT;
ALTER TABLE "households" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "households" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "households" ADD COLUMN "address" TEXT;
