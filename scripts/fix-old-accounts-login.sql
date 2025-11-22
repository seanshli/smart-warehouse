-- Fix Old Accounts Login Issue
-- 修复旧账户登录问题
-- 
-- 问题: 在添加 Community/Building schema 之前创建的账户可能无法登录
-- 原因: 可能缺少必需的关联数据或字段
--
-- 使用方法: 在 Supabase SQL Editor 中运行此脚本

-- 1. 检查旧账户状态
-- Check old account status
SELECT 
    u.id,
    u.email,
    u.name,
    u."createdAt",
    COUNT(DISTINCT h.id) as household_count,
    COUNT(DISTINCT cm.id) as community_member_count,
    COUNT(DISTINCT uc.id) as credentials_count
FROM "User" u
LEFT JOIN "HouseholdMember" hm ON hm."userId" = u.id
LEFT JOIN "Household" h ON h.id = hm."householdId"
LEFT JOIN "CommunityMember" cm ON cm."userId" = u.id
LEFT JOIN "UserCredentials" uc ON uc."userId" = u.id
WHERE u.email = 'sean.li@smtengo.com'
GROUP BY u.id, u.email, u.name, u."createdAt";

-- 2. 检查是否有 UserCredentials
-- Check if user has credentials
SELECT 
    u.id,
    u.email,
    CASE WHEN uc."userId" IS NOT NULL THEN '有凭证' ELSE '无凭证' END as credentials_status
FROM "User" u
LEFT JOIN "UserCredentials" uc ON uc."userId" = u.id
WHERE u.email = 'sean.li@smtengo.com';

-- 3. 检查是否有 Household
-- Check if user has household
SELECT 
    u.id,
    u.email,
    h.id as household_id,
    h.name as household_name,
    hm.role as household_role
FROM "User" u
LEFT JOIN "HouseholdMember" hm ON hm."userId" = u.id
LEFT JOIN "Household" h ON h.id = hm."householdId"
WHERE u.email = 'sean.li@smtengo.com';

-- 4. 修复步骤 1: 确保用户有凭证（如果需要）
-- Fix Step 1: Ensure user has credentials (if needed)
-- 注意: 需要知道密码才能创建凭证
-- Note: Need to know password to create credentials

-- 5. 修复步骤 2: 为旧账户创建默认 Household（如果不存在）
-- Fix Step 2: Create default Household for old accounts (if not exists)
INSERT INTO "Household" (
    id,
    name,
    "ownerId",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),
    COALESCE(u.name, 'Default Household') || '''s Household',
    u.id,
    NOW(),
    NOW()
FROM "User" u
WHERE u.email = 'sean.li@smtengo.com'
AND NOT EXISTS (
    SELECT 1 FROM "Household" h WHERE h."ownerId" = u.id
)
ON CONFLICT DO NOTHING;

-- 6. 验证修复结果
-- Verify fix result
SELECT 
    u.id,
    u.email,
    u.name,
    h.id as household_id,
    h.name as household_name,
    hm.role as household_role,
    CASE WHEN uc."userId" IS NOT NULL THEN '有凭证' ELSE '无凭证' END as credentials_status
FROM "User" u
LEFT JOIN "HouseholdMember" hm ON hm."userId" = u.id AND hm.role = 'OWNER'
LEFT JOIN "Household" h ON h.id = hm."householdId"
LEFT JOIN "UserCredentials" uc ON uc."userId" = u.id
WHERE u.email = 'sean.li@smtengo.com';

-- 7. 批量修复所有旧账户（可选）
-- Batch fix all old accounts (optional)
-- 为所有没有 Household 的用户创建默认 Household
DO $$
DECLARE
    v_user RECORD;
    v_household_id TEXT;
    v_household_exists BOOLEAN;
BEGIN
    FOR v_user IN 
        SELECT id, COALESCE(name, email) as name, email
        FROM "User" u
        WHERE NOT EXISTS (
            SELECT 1 
            FROM "HouseholdMember" hm 
            WHERE hm."userId" = u.id AND hm.role = 'OWNER'
        )
    LOOP
        v_household_id := gen_random_uuid()::text;
        
        INSERT INTO "Household" (id, name, "createdAt", "updatedAt")
        VALUES (
            v_household_id,
            v_user.name || '''s Household',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO "HouseholdMember" (id, "userId", "householdId", role, "joinedAt")
        VALUES (
            gen_random_uuid()::text,
            v_user.id,
            v_household_id,
            'OWNER',
            NOW()
        )
        ON CONFLICT ("userId", "householdId") DO NOTHING;
        
        RAISE NOTICE 'Created Household % for user % (%)', v_household_id, v_user.email, v_user.id;
    END LOOP;
END $$;

-- 8. 检查所有旧账户状态
-- Check all old account status
SELECT 
    u.email,
    u."createdAt",
    CASE WHEN h.id IS NOT NULL THEN '有 Household' ELSE '无 Household' END as household_status,
    CASE WHEN uc."userId" IS NOT NULL THEN '有凭证' ELSE '无凭证' END as credentials_status
FROM "User" u
LEFT JOIN "HouseholdMember" hm ON hm."userId" = u.id AND hm.role = 'OWNER'
LEFT JOIN "Household" h ON h.id = hm."householdId"
LEFT JOIN "UserCredentials" uc ON uc."userId" = u.id
ORDER BY u."createdAt" ASC
LIMIT 20;

