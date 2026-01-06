-- Verification script for workflow template type optional and household migration
-- Run this in Supabase SQL Editor to verify the migration was applied correctly

-- 1. Check if workflow_type_id is nullable in workflow_templates
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'workflow_templates'
AND column_name = 'workflow_type_id';

-- Expected: is_nullable should be 'YES'

-- 2. Check if household_id exists in workflows table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'workflows'
AND column_name = 'household_id';

-- Expected: column should exist, is_nullable should be 'YES', data_type should be 'text'

-- 3. Check foreign key constraint for workflow_templates.workflow_type_id
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'workflow_templates'
AND kcu.column_name = 'workflow_type_id';

-- Expected: delete_rule should be 'SET NULL' or 'NO ACTION', update_rule should be 'NO ACTION'

-- 4. Check foreign key constraint for workflows.household_id
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'workflows'
AND kcu.column_name = 'household_id';

-- Expected: Should exist, delete_rule should be 'SET NULL', update_rule should be 'NO ACTION'

-- 5. Check index for workflows.household_id
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'workflows'
AND indexname = 'workflows_household_id_idx';

-- Expected: Index should exist

-- 6. Summary check - count templates without workflow_type_id (should be allowed now)
SELECT 
    COUNT(*) as templates_without_type,
    COUNT(CASE WHEN workflow_type_id IS NULL THEN 1 END) as null_type_count
FROM workflow_templates;

-- 7. Summary check - count workflows with household_id
SELECT 
    COUNT(*) as total_workflows,
    COUNT(CASE WHEN household_id IS NOT NULL THEN 1 END) as workflows_with_household
FROM workflows;

