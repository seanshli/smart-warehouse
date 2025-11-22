-- 批量更新 Tuya 国家代码 SQL 脚本
-- Batch Update Tuya Country Code SQL Script
-- 
-- 使用方法: 在 Supabase SQL Editor 中运行此脚本
-- 
-- 注意: 此脚本会将所有有 Tuya 账户的用户的国家代码更新为 887 (Taiwan)

-- 1. 检查当前国家代码分布
SELECT 
    tuya_country_code,
    COUNT(*) as user_count
FROM "User"
WHERE tuya_account IS NOT NULL
GROUP BY tuya_country_code
ORDER BY user_count DESC;

-- 2. 更新所有有 Tuya 账户的用户的国家代码为 887 (Taiwan)
UPDATE "User"
SET 
    tuya_country_code = '887',
    updated_at = NOW()
WHERE tuya_account IS NOT NULL;

-- 3. 验证更新结果
SELECT 
    u.email,
    u.name,
    u.tuya_account,
    u.tuya_country_code,
    CASE 
        WHEN u.tuya_country_code = '887' THEN '✅ Taiwan'
        ELSE '❌ ' || COALESCE(u.tuya_country_code, 'null')
    END as status
FROM "User" u
WHERE u.tuya_account IS NOT NULL
ORDER BY u.email;

-- 4. 统计更新后的国家代码分布
SELECT 
    tuya_country_code,
    COUNT(*) as user_count
FROM "User"
WHERE tuya_account IS NOT NULL
GROUP BY tuya_country_code;

