-- Add tags column to items table
ALTER TABLE "items" ADD COLUMN "tags" TEXT[] DEFAULT '{}';
