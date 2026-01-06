-- Manually mark the migration as applied in Prisma's migration tracking table
-- Run this in Supabase SQL Editor if prisma migrate resolve fails

-- First, check if migration is already recorded
SELECT migration_name, finished_at, applied_steps_count 
FROM _prisma_migrations 
WHERE migration_name = '20260106043602_add_assigned_to_workflow_steps';

-- If no rows returned, insert the migration record
INSERT INTO _prisma_migrations (migration_name, checksum, finished_at, applied_steps_count)
SELECT 
    '20260106043602_add_assigned_to_workflow_steps',
    '', -- checksum can be empty for manually applied migrations
    NOW(),
    1
WHERE NOT EXISTS (
    SELECT 1 FROM _prisma_migrations 
    WHERE migration_name = '20260106043602_add_assigned_to_workflow_steps'
);

-- Verify it was inserted
SELECT migration_name, finished_at, applied_steps_count 
FROM _prisma_migrations 
WHERE migration_name = '20260106043602_add_assigned_to_workflow_steps';

