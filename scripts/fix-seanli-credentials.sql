-- Fix credentials for sean.li@smtengo.com
-- This should be run in Supabase SQL Editor

-- First, check if the user exists
SELECT id, email, name, "isAdmin" FROM "User" WHERE email = 'sean.li@smtengo.com';

-- Create or update the user
INSERT INTO "User" (email, name, "isAdmin", "createdAt", "updatedAt")
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

-- Create or update credentials with the correct password hash
INSERT INTO "UserCredentials" ("userId", password, "createdAt", "updatedAt")
SELECT 
    u.id,
    '$2a$12$gJKy2S4VHUR/4zhbbwS/ruER2iPpfLk0J4RKh3RZe4NcTWsiytSju',
    NOW(),
    NOW()
FROM "User" u
WHERE u.email = 'sean.li@smtengo.com'
ON CONFLICT ("userId") DO UPDATE SET
    password = EXCLUDED.password,
    "updatedAt" = NOW();

-- Verify the fix
SELECT 
    u.id,
    u.email,
    u.name,
    u."isAdmin",
    uc.password IS NOT NULL as has_credentials,
    uc."userId" as credentials_user_id
FROM "User" u
LEFT JOIN "UserCredentials" uc ON u.id = uc."userId"
WHERE u.email = 'sean.li@smtengo.com';
