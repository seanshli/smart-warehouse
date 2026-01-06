-- Run this to find which tables have user_id column
-- This will help us identify which table is causing the error

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name IN ('user_id', 'userId', '"userId"', '"user_id"')
AND table_schema = 'public'
ORDER BY table_name, column_name;

-- Also check for any tables that might be referenced in the RLS policies
SELECT DISTINCT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'user_credentials',
    'household_members',
    'working_group_members',
    'crew_members',
    'community_members',
    'building_members'
)
ORDER BY table_name;


