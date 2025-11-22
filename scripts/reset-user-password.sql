-- 重置用户密码 SQL 脚本
-- Reset User Password SQL Script
-- 
-- 使用方法: 在 Supabase SQL Editor 中运行此脚本
-- 
-- 注意: 需要先使用 bcrypt 生成密码哈希
-- 可以使用 Node.js 生成:
--   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword123!', 12).then(hash => console.log(hash));"
--
-- 或者使用在线工具: https://bcrypt-generator.com/

-- 1. 检查用户是否存在
SELECT 
    u.id,
    u.email,
    u.name,
    CASE WHEN uc."userId" IS NOT NULL THEN '有凭证' ELSE '无凭证' END as credentials_status
FROM "User" u
LEFT JOIN "UserCredentials" uc ON uc."userId" = u.id
WHERE u.email = 'sean.li@smtengo.com';

-- 2. 更新现有凭证的密码
-- 注意: 将 '$2a$12$...' 替换为实际的 bcrypt 哈希值
UPDATE "UserCredentials"
SET 
    password = '$2a$12$YOUR_BCRYPT_HASH_HERE',
    "updatedAt" = NOW()
WHERE "userId" = (
    SELECT id FROM "User" WHERE email = 'sean.li@smtengo.com'
);

-- 3. 如果用户没有凭证，创建新凭证
-- 注意: 将 '$2a$12$...' 替换为实际的 bcrypt 哈希值
INSERT INTO "UserCredentials" ("userId", password, "createdAt", "updatedAt")
SELECT 
    u.id,
    '$2a$12$YOUR_BCRYPT_HASH_HERE',
    NOW(),
    NOW()
FROM "User" u
WHERE u.email = 'sean.li@smtengo.com'
AND NOT EXISTS (
    SELECT 1 FROM "UserCredentials" uc WHERE uc."userId" = u.id
)
ON CONFLICT ("userId") DO NOTHING;

-- 4. 验证更新结果
SELECT 
    u.email,
    u.name,
    CASE WHEN uc."userId" IS NOT NULL THEN '有凭证' ELSE '无凭证' END as credentials_status,
    uc."updatedAt" as last_updated
FROM "User" u
LEFT JOIN "UserCredentials" uc ON uc."userId" = u.id
WHERE u.email = 'sean.li@smtengo.com';

