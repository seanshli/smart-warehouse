-- Verify Password Hash in Database
-- This will help us see the actual hash stored and verify it matches

-- Get the actual password hashes from database
SELECT 
  u.email,
  u.id as user_id,
  uc.password as stored_hash,
  LENGTH(uc.password) as hash_length,
  LEFT(uc.password, 7) as hash_prefix,
  -- Expected hashes (from our generation)
  CASE 
    WHEN u.email = 'sean.li@smtengo.com' THEN '$2a$12$gJazZWyACNpheP989Ngch.FWm1bH40gtC8.PjtsPbMV8CB3zjQShe'
    WHEN u.email = 'demo@smartwarehouse.com' THEN '$2a$12$sveHtUfw3XxykjAfbQ.2Zunj0ALU5YxOZPtWTsDR3UszYBqhDwo.i'
  END as expected_hash,
  -- Check if they match
  CASE 
    WHEN u.email = 'sean.li@smtengo.com' AND uc.password = '$2a$12$gJazZWyACNpheP989Ngch.FWm1bH40gtC8.PjtsPbMV8CB3zjQShe' THEN '✅ Matches'
    WHEN u.email = 'demo@smartwarehouse.com' AND uc.password = '$2a$12$sveHtUfw3XxykjAfbQ.2Zunj0ALU5YxOZPtWTsDR3UszYBqhDwo.i' THEN '✅ Matches'
    ELSE '❌ Different hash'
  END as hash_match
FROM users u
JOIN user_credentials uc ON u.id = uc.user_id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');

