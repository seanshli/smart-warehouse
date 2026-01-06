-- Run this to check user_credentials table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_credentials'
ORDER BY ordinal_position;

-- Also check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%credential%'
ORDER BY table_name;


