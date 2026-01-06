-- Run this FIRST to diagnose the actual column name
-- Copy and paste into Supabase SQL Editor

-- Check user_credentials table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_credentials'
ORDER BY ordinal_position;

-- Try to see what columns PostgreSQL sees
SELECT * FROM user_credentials LIMIT 0;


