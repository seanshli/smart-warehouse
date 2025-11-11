-- Quick Fix: Re-insert credentials with correct format
-- Run this if the previous fix didn't work

-- Step 1: Delete existing credentials (if any)
DELETE FROM user_credentials 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
);

-- Step 2: Re-insert with correct hashes
INSERT INTO user_credentials (user_id, password, "created_at", "updated_at")
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'sean.li@smtengo.com' THEN '$2a$12$gJazZWyACNpheP989Ngch.FWm1bH40gtC8.PjtsPbMV8CB3zjQShe'
    WHEN u.email = 'demo@smartwarehouse.com' THEN '$2a$12$sveHtUfw3XxykjAfbQ.2Zunj0ALU5YxOZPtWTsDR3UszYBqhDwo.i'
  END,
  NOW(),
  NOW()
FROM users u
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
ON CONFLICT (user_id) DO UPDATE SET 
  password = EXCLUDED.password,
  "updated_at" = NOW();

-- Step 3: Verify
SELECT 
  u.email,
  u.id as user_id,
  uc.user_id as credential_user_id,
  CASE WHEN uc.password IS NOT NULL THEN '✅' ELSE '❌' END as has_password,
  LENGTH(uc.password) as password_length,
  LEFT(uc.password, 7) as password_prefix
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');

