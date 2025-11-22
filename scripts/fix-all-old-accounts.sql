-- 批量修复所有旧账户 SQL 脚本
-- Fix All Old Accounts SQL Script
-- 
-- 使用方法: 在 Supabase SQL Editor 中运行此脚本
-- 
-- 注意: 此脚本只会创建 Household，不会创建 UserCredentials
-- 如果需要创建凭证，需要知道密码或使用密码重置脚本

-- 1. 检查所有旧账户状态
SELECT 
    u.email,
    u.name,
    u."createdAt",
    CASE WHEN uc."userId" IS NOT NULL THEN '有凭证' ELSE '无凭证' END as credentials_status,
    CASE WHEN hm."userId" IS NOT NULL THEN '有 Household' ELSE '无 Household' END as household_status,
    COUNT(DISTINCT hm."householdId") as household_count
FROM "User" u
LEFT JOIN "UserCredentials" uc ON uc."userId" = u.id
LEFT JOIN "HouseholdMember" hm ON hm."userId" = u.id
GROUP BY u.id, u.email, u.name, u."createdAt", uc."userId", hm."userId"
ORDER BY u."createdAt" ASC;

-- 2. 为所有没有 Household 的用户创建默认 Household
DO $$
DECLARE
    v_user RECORD;
    v_household_id TEXT;
    v_user_name TEXT;
    v_fixed_count INTEGER := 0;
    v_error_count INTEGER := 0;
BEGIN
    FOR v_user IN 
        SELECT id, email, COALESCE(name, email) as name
        FROM "User" u
        WHERE NOT EXISTS (
            SELECT 1 
            FROM "HouseholdMember" hm 
            WHERE hm."userId" = u.id
        )
    LOOP
        BEGIN
            v_household_id := gen_random_uuid()::text;
            v_user_name := v_user.name;
            
            -- 创建 Household
            INSERT INTO "Household" (id, name, description, "createdAt", "updatedAt")
            VALUES (
                v_household_id,
                v_user_name || '''s Household',
                '自动创建的默认 Household',
                NOW(),
                NOW()
            );
            
            -- 创建成员关系（OWNER 角色）
            INSERT INTO "HouseholdMember" (id, "userId", "householdId", role, "joinedAt")
            VALUES (
                gen_random_uuid()::text,
                v_user.id,
                v_household_id,
                'OWNER',
                NOW()
            );
            
            v_fixed_count := v_fixed_count + 1;
            RAISE NOTICE '✅ 已为 % 创建 Household %', v_user.email, v_household_id;
        EXCEPTION
            WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                RAISE NOTICE '❌ 修复 % 失败: %', v_user.email, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 修复结果:';
    RAISE NOTICE '成功: %', v_fixed_count;
    RAISE NOTICE '失败: %', v_error_count;
    RAISE NOTICE '总计: %', v_fixed_count + v_error_count;
END $$;

-- 3. 验证修复结果
SELECT 
    u.email,
    u.name,
    CASE WHEN uc."userId" IS NOT NULL THEN '有凭证' ELSE '无凭证' END as credentials_status,
    CASE WHEN hm."userId" IS NOT NULL THEN '有 Household' ELSE '无 Household' END as household_status,
    COUNT(DISTINCT hm."householdId") as household_count
FROM "User" u
LEFT JOIN "UserCredentials" uc ON uc."userId" = u.id
LEFT JOIN "HouseholdMember" hm ON hm."userId" = u.id
GROUP BY u.id, u.email, u.name, uc."userId", hm."userId"
ORDER BY u."createdAt" ASC;

-- 4. 列出所有缺少 UserCredentials 的用户
SELECT 
    u.email,
    u.name,
    u."createdAt"
FROM "User" u
LEFT JOIN "UserCredentials" uc ON uc."userId" = u.id
WHERE uc."userId" IS NULL
ORDER BY u."createdAt" ASC;

