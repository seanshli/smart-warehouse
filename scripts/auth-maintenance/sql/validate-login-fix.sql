-- Validation Queries for Login Fix
-- Run these in Supabase SQL Editor to verify the fix

-- 1. Check if users exist
SELECT id, email, name, "isAdmin", "created_at"
FROM users 
WHERE email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
ORDER BY email;

-- 2. Check if credentials exist and have passwords
SELECT 
  u.email,
  u.name,
  CASE WHEN uc.password IS NOT NULL THEN '✅ Has password' ELSE '❌ No password' END as password_status,
  LENGTH(uc.password) as password_length
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
ORDER BY u.email;

-- 3. Check if users have households
SELECT 
  u.email,
  u.name,
  h.name as household_name,
  hm.role as household_role,
  CASE WHEN hm.household_id IS NOT NULL THEN '✅ Has household' ELSE '❌ No household' END as household_status
FROM users u
LEFT JOIN household_members hm ON u.id = hm.user_id
LEFT JOIN households h ON hm.household_id = h.id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
ORDER BY u.email;

-- 4. Complete status check
SELECT 
  u.email,
  u.name,
  u."isAdmin",
  CASE WHEN uc.password IS NOT NULL THEN '✅' ELSE '❌' END as has_password,
  CASE WHEN hm.household_id IS NOT NULL THEN '✅' ELSE '❌' END as has_household,
  h.name as household_name,
  hm.role as household_role
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
LEFT JOIN household_members hm ON u.id = hm.user_id
LEFT JOIN households h ON hm.household_id = h.id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
ORDER BY u.email;

