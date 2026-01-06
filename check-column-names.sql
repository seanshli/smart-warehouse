-- Run this in Supabase SQL Editor to check actual column names
-- This will show us what columns actually exist

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('household_members', 'HouseholdMember')
ORDER BY table_name, ordinal_position;

-- Also check if there are two different tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%household%member%' OR table_name LIKE '%Household%Member%')
ORDER BY table_name;


