-- Check catering menu items table schema
-- Run this in Supabase SQL Editor to verify all required columns exist

-- Check if catering_menu_items table exists and has all required columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'catering_menu_items'
ORDER BY ordinal_position;

-- Check if catering_categories table has parent_id and level columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'catering_categories'
  AND column_name IN ('parent_id', 'level')
ORDER BY column_name;

-- Check for any menu items that might have NULL values in required fields
SELECT 
  id,
  name,
  service_id,
  category_id,
  cost,
  quantity_available,
  is_active,
  available_all_day,
  image_url,
  created_at
FROM catering_menu_items
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any items with missing category relationships
SELECT 
  COUNT(*) as items_with_null_category,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as null_categories
FROM catering_menu_items;
