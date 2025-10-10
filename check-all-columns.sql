-- Check all table schemas for column mapping issues
-- Run this in Supabase SQL Editor

-- Check households table columns
SELECT 'households' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'households' 
ORDER BY ordinal_position;

-- Check users table columns
SELECT 'users' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check household_members table columns
SELECT 'household_members' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'household_members' 
ORDER BY ordinal_position;

-- Check rooms table columns
SELECT 'rooms' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'rooms' 
ORDER BY ordinal_position;

-- Check categories table columns
SELECT 'categories' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;
