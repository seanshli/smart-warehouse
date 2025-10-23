-- Fix user credentials for seanshlicn@gmail.com
-- First, let's check if the user exists and get their ID
SELECT id, email, name, "isAdmin" FROM "User" WHERE email = 'seanshlicn@gmail.com';

-- If the user exists, update their credentials
-- If not, we'll need to create them first

-- Update or insert credentials
INSERT INTO "UserCredentials" ("userId", password, "createdAt", "updatedAt")
SELECT 
  u.id,
  '$2a$12$gJKy2S4VHUR/4zhbbwS/ruER2iPpfLk0J4RKh3RZe4NcTWsiytSju',
  NOW(),
  NOW()
FROM "User" u
WHERE u.email = 'seanshlicn@gmail.com'
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
WHERE u.email = 'seanshlicn@gmail.com';
