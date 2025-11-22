-- Verification script for Community and Building migration
-- Run this in Supabase Dashboard SQL Editor to verify migration

-- 1. Check if all tables exist
SELECT 
  'Table Check' as check_type,
  table_name,
  CASE 
    WHEN table_name IN (
      'communities',
      'buildings',
      'community_members',
      'working_groups',
      'working_group_members',
      'working_group_permissions'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'communities',
  'buildings',
  'community_members',
  'working_groups',
  'working_group_members',
  'working_group_permissions'
)
ORDER BY table_name;

-- 2. Check if building_id column exists in households
SELECT 
  'Column Check' as check_type,
  'households.building_id' as column_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'households' AND column_name = 'building_id'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 3. Check foreign key constraints
SELECT 
  'Foreign Key Check' as check_type,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅ EXISTS' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN (
  'buildings',
  'community_members',
  'working_groups',
  'working_group_members',
  'working_group_permissions',
  'households'
)
ORDER BY tc.table_name, tc.constraint_name;

-- 4. Check indexes
SELECT 
  'Index Check' as check_type,
  indexname as index_name,
  tablename as table_name,
  '✅ EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
  'communities',
  'buildings',
  'households',
  'community_members',
  'working_groups',
  'working_group_members',
  'working_group_permissions'
)
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 5. Check unique constraints
SELECT 
  'Unique Constraint Check' as check_type,
  tc.constraint_name,
  tc.table_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns,
  '✅ EXISTS' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public'
AND tc.table_name IN (
  'communities',
  'buildings',
  'community_members',
  'working_groups',
  'working_group_members',
  'working_group_permissions'
)
GROUP BY tc.constraint_name, tc.table_name
ORDER BY tc.table_name, tc.constraint_name;

-- 6. Count records (should be 0 for new tables)
SELECT 
  'Record Count' as check_type,
  'communities' as table_name,
  COUNT(*) as record_count
FROM communities
UNION ALL
SELECT 
  'Record Count' as check_type,
  'buildings' as table_name,
  COUNT(*) as record_count
FROM buildings
UNION ALL
SELECT 
  'Record Count' as check_type,
  'community_members' as table_name,
  COUNT(*) as record_count
FROM community_members
UNION ALL
SELECT 
  'Record Count' as check_type,
  'working_groups' as table_name,
  COUNT(*) as record_count
FROM working_groups
UNION ALL
SELECT 
  'Record Count' as check_type,
  'working_group_members' as table_name,
  COUNT(*) as record_count
FROM working_group_members
UNION ALL
SELECT 
  'Record Count' as check_type,
  'working_group_permissions' as table_name,
  COUNT(*) as record_count
FROM working_group_permissions;

