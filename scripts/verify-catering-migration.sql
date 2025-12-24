-- Verify that catering category hierarchy migration has been applied
-- Run this in your Supabase SQL editor to check if columns exist

-- Check if parent_id and level columns exist in catering_categories
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'catering_categories'
  AND column_name IN ('parent_id', 'level')
ORDER BY column_name;

-- Check if catering_category_time_slots table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'catering_category_time_slots'
) AS time_slots_table_exists;

-- If columns don't exist, you need to run the migration:
-- See: prisma/migrations/add-catering-category-hierarchy-and-timeslots.sql
