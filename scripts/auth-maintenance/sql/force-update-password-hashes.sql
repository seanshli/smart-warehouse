-- Force Update Password Hashes
-- Use this if the hashes don't match what we expect
-- This will update with the correct hashes we generated

UPDATE user_credentials 
SET 
  password = CASE 
    WHEN user_id = (SELECT id FROM users WHERE email = 'sean.li@smtengo.com') 
    THEN '$2a$12$gJazZWyACNpheP989Ngch.FWm1bH40gtC8.PjtsPbMV8CB3zjQShe'
    WHEN user_id = (SELECT id FROM users WHERE email = 'demo@smartwarehouse.com')
    THEN '$2a$12$sveHtUfw3XxykjAfbQ.2Zunj0ALU5YxOZPtWTsDR3UszYBqhDwo.i'
  END,
  "updated_at" = NOW()
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
);

-- Verify the update
SELECT 
  u.email,
  uc.password = CASE 
    WHEN u.email = 'sean.li@smtengo.com' THEN '$2a$12$gJazZWyACNpheP989Ngch.FWm1bH40gtC8.PjtsPbMV8CB3zjQShe'
    WHEN u.email = 'demo@smartwarehouse.com' THEN '$2a$12$sveHtUfw3XxykjAfbQ.2Zunj0ALU5YxOZPtWTsDR3UszYBqhDwo.i'
  END as hash_matches_expected,
  LEFT(uc.password, 30) as hash_preview
FROM users u
JOIN user_credentials uc ON u.id = uc.user_id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');

