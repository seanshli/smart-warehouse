-- Fix Login Credentials for sean.li@smtengo.com and demo@smartwarehouse.com
-- Run this in Supabase SQL Editor

-- Import bcrypt extension if needed (usually already available)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash password (bcrypt equivalent)
-- Note: Supabase uses bcrypt for password hashing
-- We'll use the same format as the application

-- First, ensure users exist
INSERT INTO users (email, name, "isAdmin", "created_at", "updated_at")
VALUES 
  ('sean.li@smtengo.com', 'Sean Li', true, NOW(), NOW()),
  ('demo@smartwarehouse.com', 'Demo User', false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  "isAdmin" = EXCLUDED."isAdmin",
  "updated_at" = NOW();

-- Get user IDs
DO $$
DECLARE
  sean_user_id TEXT;
  demo_user_id TEXT;
  sean_password_hash TEXT := '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY1Z5LQv3c1'; -- Smtengo1324!
  demo_password_hash TEXT := '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7t92F6ZMAz1x8KpYLN9qo8u'; -- demo123
BEGIN
  -- Get user IDs
  SELECT id INTO sean_user_id FROM users WHERE email = 'sean.li@smtengo.com';
  SELECT id INTO demo_user_id FROM users WHERE email = 'demo@smartwarehouse.com';

  -- Create or update credentials for sean.li@smtengo.com
  IF sean_user_id IS NOT NULL THEN
    INSERT INTO user_credentials (user_id, password)
    VALUES (sean_user_id, sean_password_hash)
    ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password;
    
    RAISE NOTICE 'Credentials set for sean.li@smtengo.com';
  END IF;

  -- Create or update credentials for demo@smartwarehouse.com
  IF demo_user_id IS NOT NULL THEN
    INSERT INTO user_credentials (user_id, password)
    VALUES (demo_user_id, demo_password_hash)
    ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password;
    
    RAISE NOTICE 'Credentials set for demo@smartwarehouse.com';
  END IF;
END $$;

-- Ensure users have households
DO $$
DECLARE
  sean_user_id TEXT;
  demo_user_id TEXT;
  sean_household_id TEXT;
  demo_household_id TEXT;
BEGIN
  SELECT id INTO sean_user_id FROM users WHERE email = 'sean.li@smtengo.com';
  SELECT id INTO demo_user_id FROM users WHERE email = 'demo@smartwarehouse.com';

  -- Create household for sean.li if doesn't exist
  IF sean_user_id IS NOT NULL THEN
    SELECT id INTO sean_household_id FROM households WHERE name LIKE '%Sean%' OR name LIKE '%sean%' LIMIT 1;
    
    IF sean_household_id IS NULL THEN
      INSERT INTO households (id, name, description, "created_at", "updated_at")
      VALUES (gen_random_uuid()::text, 'Sean Li''s Household', 'Personal household', NOW(), NOW())
      RETURNING id INTO sean_household_id;
    END IF;

    -- Add user to household
    INSERT INTO household_members (user_id, household_id, role, "created_at")
    VALUES (sean_user_id, sean_household_id, 'OWNER', NOW())
    ON CONFLICT (user_id, household_id) DO NOTHING;
  END IF;

  -- Create household for demo user if doesn't exist
  IF demo_user_id IS NOT NULL THEN
    SELECT id INTO demo_household_id FROM households WHERE name LIKE '%Demo%' LIMIT 1;
    
    IF demo_household_id IS NULL THEN
      INSERT INTO households (id, name, description, "created_at", "updated_at")
      VALUES (gen_random_uuid()::text, 'Demo Household', 'Demo user household', NOW(), NOW())
      RETURNING id INTO demo_household_id;
    END IF;

    -- Add user to household
    INSERT INTO household_members (user_id, household_id, role, "created_at")
    VALUES (demo_user_id, demo_household_id, 'OWNER', NOW())
    ON CONFLICT (user_id, household_id) DO NOTHING;
  END IF;
END $$;

-- Note: The password hashes above are placeholders
-- You need to generate actual bcrypt hashes for:
-- Password: Smtengo1324! -> hash needed
-- Password: demo123 -> hash needed

-- Alternative: Use the setup-user-credentials.js script which properly hashes passwords
-- Or use the API endpoint: POST /api/admin/setup-credentials

