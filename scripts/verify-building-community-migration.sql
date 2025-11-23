-- Verification script for Building and Community join system migration
-- 验证 Building 和 Community 加入系统迁移脚本
--
-- 使用方法: 在 Supabase SQL Editor 中运行此脚本以验证迁移是否成功

-- 1. 验证 buildings 表结构
SELECT 
    'buildings' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'buildings'
  AND column_name = 'invitation_code';

-- 2. 验证 building_members 表结构
SELECT 
    'building_members' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'building_members'
ORDER BY ordinal_position;

-- 3. 验证 community_members 表结构（is_auto_joined 字段）
SELECT 
    'community_members' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'community_members'
  AND column_name = 'is_auto_joined';

-- 4. 验证 join_requests 表结构
SELECT 
    'join_requests' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'join_requests'
ORDER BY ordinal_position;

-- 5. 验证索引
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('building_members', 'join_requests')
ORDER BY tablename, indexname;

-- 6. 验证外键约束
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('building_members', 'join_requests')
ORDER BY tc.table_name, kcu.column_name;

-- 7. 验证唯一约束
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name IN ('building_members', 'join_requests')
ORDER BY tc.table_name, kcu.column_name;

