-- Debug Login Issue
-- Run this in Supabase SQL Editor to check the actual state

-- 1. Check if users exist
SELECT 
  id, 
  email, 
  name, 
  "isAdmin",
  "created_at"
FROM users 
WHERE email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
ORDER BY email;

-- 2. Check credentials table structure and data
SELECT 
  uc.user_id,
  u.email,
  uc.password IS NOT NULL as has_password,
  LENGTH(uc.password) as password_length,
  LEFT(uc.password, 20) as password_preview,
  uc."created_at",
  uc."updated_at"
FROM user_credentials uc
JOIN users u ON uc.user_id = u.id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
ORDER BY u.email;

-- 3. Check if credentials table exists and has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_credentials'
ORDER BY ordinal_position;

-- 4. Check all credentials for these users (including any issues)
SELECT 
  u.id as user_id,
  u.email,
  uc.user_id as credential_user_id,
  CASE WHEN uc.password IS NULL THEN 'NULL password' 
       WHEN LENGTH(uc.password) < 50 THEN 'Password too short: ' || LENGTH(uc.password)
       ELSE 'Password OK: ' || LENGTH(uc.password) END as password_status,
  uc.password LIKE '$2a$12$%' as is_bcrypt_format
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
ORDER BY u.email;

-- 5. Check household memberships
SELECT 
  u.email,
  hm.user_id,
  hm.household_id,
  hm.role,
  h.name as household_name
FROM users u
LEFT JOIN household_members hm ON u.id = hm.user_id
LEFT JOIN households h ON hm.household_id = h.id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
ORDER BY u.email;

