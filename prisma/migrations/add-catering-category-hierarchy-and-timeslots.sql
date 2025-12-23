-- Add category hierarchy support (parent/child relationship) to catering_categories
-- Similar to warehouse categories structure

-- Add parent_id and level columns to catering_categories
ALTER TABLE "catering_categories"
ADD COLUMN IF NOT EXISTS "parent_id" TEXT,
ADD COLUMN IF NOT EXISTS "level" INTEGER DEFAULT 1;

-- Add foreign key constraint for parent_id (self-referential)
ALTER TABLE "catering_categories"
ADD CONSTRAINT "fk_catering_category_parent"
FOREIGN KEY ("parent_id") REFERENCES "catering_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for parent_id for faster queries
CREATE INDEX IF NOT EXISTS "idx_catering_categories_parent_id" ON "catering_categories"("parent_id");

-- Add index for level for faster queries
CREATE INDEX IF NOT EXISTS "idx_catering_categories_level" ON "catering_categories"("level");

-- Create table for category-level time slots
-- This allows all items in a category to inherit the category's time slot
CREATE TABLE IF NOT EXISTS "catering_category_time_slots" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "category_id" TEXT NOT NULL,
  "day_of_week" INTEGER NOT NULL DEFAULT -1, -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday, -1 = All days
  "start_time" TEXT NOT NULL, -- Time in HH:mm format (e.g., "09:00")
  "end_time" TEXT NOT NULL, -- Time in HH:mm format (e.g., "17:00")
  "is_weekend" BOOLEAN DEFAULT false, -- true for weekend (Sat/Sun), false for weekday (Mon-Fri), null for all days
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT "fk_catering_category_time_slot_category"
    FOREIGN KEY ("category_id") REFERENCES "catering_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_catering_category_time_slots_category_id" ON "catering_category_time_slots"("category_id");
CREATE INDEX IF NOT EXISTS "idx_catering_category_time_slots_day_of_week" ON "catering_category_time_slots"("day_of_week");
CREATE INDEX IF NOT EXISTS "idx_catering_category_time_slots_is_weekend" ON "catering_category_time_slots"("is_weekend");

-- Add comments for documentation
COMMENT ON COLUMN "catering_categories"."parent_id" IS 'Reference to parent category for hierarchical structure. NULL for top-level categories.';
COMMENT ON COLUMN "catering_categories"."level" IS 'Hierarchy level: 1 for top-level categories, 2 for sub-categories.';
COMMENT ON COLUMN "catering_category_time_slots"."day_of_week" IS '0 = Sunday, 1 = Monday, ..., 6 = Saturday, -1 = All days';
COMMENT ON COLUMN "catering_category_time_slots"."is_weekend" IS 'true for weekend (Sat/Sun), false for weekday (Mon-Fri), null for all days. Used with day_of_week to distinguish weekday/weekend availability.';

-- Update existing categories to have level = 1 (top-level) if not set
UPDATE "catering_categories"
SET "level" = 1
WHERE "level" IS NULL;
