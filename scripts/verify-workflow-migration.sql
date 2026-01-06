-- Verify that the workflow steps migration was applied
-- Run this in Supabase SQL Editor to check

-- Check if columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('workflow_template_steps', 'workflow_steps')
  AND column_name = 'assigned_to_id'
ORDER BY table_name, column_name;

-- Check if foreign keys exist
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('workflow_template_steps', 'workflow_steps')
  AND kcu.column_name = 'assigned_to_id';

-- Check if indexes exist
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE tablename IN ('workflow_template_steps', 'workflow_steps')
  AND indexname LIKE '%assigned_to_id%';

