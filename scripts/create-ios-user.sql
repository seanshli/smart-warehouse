-- Create user credentials for iOS app login
-- This script should be run against the production Supabase database

-- First, check if the user exists
SELECT id, email, name, "isAdmin" FROM "User" WHERE email = 'seanshlicn@gmail.com';

-- If user doesn't exist, create them
INSERT INTO "User" (id, email, name, "isAdmin", "emailVerified", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'seanshlicn@gmail.com',
    'Sean Li',
    false,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create or update credentials for the user
INSERT INTO "UserCredentials" ("userId", password, "createdAt", "updatedAt")
SELECT 
  u.id,
  '$2a$12$gJKy2S4VHUR/4zhbbwS/ruER2iPpfLk0J4RKh3RZe4NcTWsiytSju', -- Hash for Smtengo1324!
  NOW(),
  NOW()
FROM "User" u
WHERE u.email = 'seanshlicn@gmail.com'
ON CONFLICT ("userId") DO UPDATE SET
  password = EXCLUDED.password,
  "updatedAt" = NOW();

-- Verify the setup
SELECT 
  u.id, 
  u.email, 
  u.name, 
  u."isAdmin",
  uc.password IS NOT NULL as has_credentials,
  uc."userId" as credentials_user_id
FROM "User" u
LEFT JOIN "UserCredentials" uc ON u.id = uc."userId"
WHERE u.email = 'seanshlicn@gmail.com';
