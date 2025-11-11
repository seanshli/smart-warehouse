-- Fix User Credentials for Production Database
-- Run this in Supabase SQL Editor
-- These users are already in production database, we just need to fix their credentials

-- Step 1: Check if users exist
SELECT id, email, name, "isAdmin" 
FROM users 
WHERE email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');

-- Step 2: Generate password hashes (run this in Node.js first)
-- node -e "const bcrypt=require('bcryptjs');Promise.all([bcrypt.hash('Smtengo1324!',12),bcrypt.hash('demo123',12)]).then(([h1,h2])=>console.log('Sean:',h1,'\nDemo:',h2));"
-- Then use the generated hashes below

-- Step 3: Create or update user credentials
-- IMPORTANT: Replace YOUR_SEAN_HASH and YOUR_DEMO_HASH with actual bcrypt hashes from Step 2

DO $$
DECLARE
  sean_user_id TEXT;
  demo_user_id TEXT;
  sean_hash TEXT := '$2a$12$gJazZWyACNpheP989Ngch.FWm1bH40gtC8.PjtsPbMV8CB3zjQShe';  -- Hash for 'Smtengo1324!'
  demo_hash TEXT := '$2a$12$sveHtUfw3XxykjAfbQ.2Zunj0ALU5YxOZPtWTsDR3UszYBqhDwo.i';  -- Hash for 'demo123'
BEGIN
  -- Get user IDs
  SELECT id INTO sean_user_id FROM users WHERE email = 'sean.li@smtengo.com';
  SELECT id INTO demo_user_id FROM users WHERE email = 'demo@smartwarehouse.com';

  -- Create or update credentials for sean.li@smtengo.com
  IF sean_user_id IS NOT NULL THEN
    INSERT INTO user_credentials (user_id, password)
    VALUES (sean_user_id, sean_hash)
    ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password;
    
    RAISE NOTICE '✅ Credentials set for sean.li@smtengo.com';
  ELSE
    RAISE NOTICE '❌ User sean.li@smtengo.com not found';
  END IF;

  -- Create or update credentials for demo@smartwarehouse.com
  IF demo_user_id IS NOT NULL THEN
    INSERT INTO user_credentials (user_id, password)
    VALUES (demo_user_id, demo_hash)
    ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password;
    
    RAISE NOTICE '✅ Credentials set for demo@smartwarehouse.com';
  ELSE
    RAISE NOTICE '❌ User demo@smartwarehouse.com not found';
  END IF;
END $$;

-- Step 4: Verify credentials were set
SELECT 
  u.email, 
  u.name,
  u."isAdmin",
  CASE WHEN uc.password IS NOT NULL THEN '✅ Has password' ELSE '❌ No password' END as password_status
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');

-- Step 5: Ensure users have households
DO $$
DECLARE
  sean_user_id TEXT;
  demo_user_id TEXT;
  sean_household_id TEXT;
  demo_household_id TEXT;
BEGIN
  SELECT id INTO sean_user_id FROM users WHERE email = 'sean.li@smtengo.com';
  SELECT id INTO demo_user_id FROM users WHERE email = 'demo@smartwarehouse.com';

  -- Check/create household for sean.li
  IF sean_user_id IS NOT NULL THEN
    -- Check if user already has a household
    SELECT household_id INTO sean_household_id 
    FROM household_members 
    WHERE user_id = sean_user_id 
    LIMIT 1;
    
    IF sean_household_id IS NULL THEN
      -- Create new household
      INSERT INTO households (id, name, description, "created_at", "updated_at")
      VALUES (gen_random_uuid()::text, 'Sean Li''s Household', 'Personal household', NOW(), NOW())
      RETURNING id INTO sean_household_id;
      
      -- Add user as OWNER
      INSERT INTO household_members (user_id, household_id, role, "created_at")
      VALUES (sean_user_id, sean_household_id, 'OWNER', NOW());
      
      RAISE NOTICE '✅ Household created for sean.li@smtengo.com';
    ELSE
      RAISE NOTICE '✅ Household already exists for sean.li@smtengo.com';
    END IF;
  END IF;

  -- Check/create household for demo user
  IF demo_user_id IS NOT NULL THEN
    -- Check if user already has a household
    SELECT household_id INTO demo_household_id 
    FROM household_members 
    WHERE user_id = demo_user_id 
    LIMIT 1;
    
    IF demo_household_id IS NULL THEN
      -- Create new household
      INSERT INTO households (id, name, description, "created_at", "updated_at")
      VALUES (gen_random_uuid()::text, 'Demo Household', 'Demo user household', NOW(), NOW())
      RETURNING id INTO demo_household_id;
      
      -- Add user as OWNER
      INSERT INTO household_members (user_id, household_id, role, "created_at")
      VALUES (demo_user_id, demo_household_id, 'OWNER', NOW());
      
      RAISE NOTICE '✅ Household created for demo@smartwarehouse.com';
    ELSE
      RAISE NOTICE '✅ Household already exists for demo@smartwarehouse.com';
    END IF;
  END IF;
END $$;

-- Step 6: Final verification
SELECT 
  u.email,
  u.name,
  u."isAdmin",
  CASE WHEN uc.password IS NOT NULL THEN '✅' ELSE '❌' END as has_password,
  CASE WHEN hm.household_id IS NOT NULL THEN '✅' ELSE '❌' END as has_household,
  h.name as household_name
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
LEFT JOIN household_members hm ON u.id = hm.user_id
LEFT JOIN households h ON hm.household_id = h.id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');

