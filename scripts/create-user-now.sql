-- Create user and credentials for sean.li@smtengo.com
-- Run this in Supabase SQL Editor

-- First, check if user exists
SELECT id, email, name, "isAdmin" FROM "User" WHERE email = 'sean.li@smtengo.com';

-- Create or update the user
INSERT INTO "User" (id, email, name, "isAdmin", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'sean.li@smtengo.com',
    'Sean Li',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    "isAdmin" = EXCLUDED."isAdmin",
    "updatedAt" = NOW();

-- Create or update credentials  
WITH user_info AS (
    SELECT id FROM "User" WHERE email = 'sean.li@smtengo.com'
)
INSERT INTO "user_credentials" ("user_id", password, created_at, updated_at)
SELECT 
    id,
    '$2a$12$gJKy2S4VHUR/4zhbbwS/ruER2iPpfLk0J4RKh3RZe4NcTWsiytSju',
    NOW(),
    NOW()
FROM user_info
ON CONFLICT ("user_id") DO UPDATE SET
    password = EXCLUDED.password,
    updated_at = NOW();

-- Verify
SELECT 
    u.id, u.email, u.name, u."isAdmin",
    uc.password IS NOT NULL as has_credentials
FROM "User" u
LEFT JOIN "user_credentials" uc ON u.id = uc."user_id"
WHERE u.email = 'sean.li@smtengo.com';
