-- Fix demo user household association
-- Run this in Supabase SQL Editor

-- First, let's see what the demo user ID actually looks like
SELECT 
  u.email,
  u.id as user_id,
  u.name,
  h.id as household_id,
  h.name as household_name,
  hm.role
FROM users u
LEFT JOIN household_members hm ON u.id = hm.user_id
LEFT JOIN households h ON hm.household_id = h.id
WHERE u.email = 'demo@smartwarehouse.com';

-- Create household for demo user (using proper UUID generation)
INSERT INTO households (id, name, description, invitation_code, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Demo Household', 
  'Demo household for testing',
  'DEMO123',
  NOW(),
  NOW()
)
ON CONFLICT (invitation_code) DO NOTHING;

-- Add demo user to household (using the actual user ID from the query above)
INSERT INTO household_members (id, user_id, household_id, role, joined_at)
SELECT 
  gen_random_uuid(),
  u.id,
  h.id,
  'OWNER',
  NOW()
FROM users u, households h
WHERE u.email = 'demo@smartwarehouse.com' 
  AND h.invitation_code = 'DEMO123'
  AND NOT EXISTS (
    SELECT 1 FROM household_members hm 
    WHERE hm.user_id = u.id AND hm.household_id = h.id
  );

-- Create default rooms for the demo household
INSERT INTO rooms (id, name, description, household_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  room_name,
  room_description,
  h.id,
  NOW(),
  NOW()
FROM households h,
(VALUES 
  ('Kitchen', 'Kitchen area'),
  ('Living Room', 'Main living area'),
  ('Bedroom', 'Bedroom'),
  ('Garage', 'Garage and storage')
) AS rooms(room_name, room_description)
WHERE h.invitation_code = 'DEMO123'
ON CONFLICT DO NOTHING;

-- Create default categories for the demo household
INSERT INTO categories (id, name, description, level, parent_id, household_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  category_name,
  category_description,
  1,
  NULL,
  h.id,
  NOW(),
  NOW()
FROM households h,
(VALUES 
  ('Electronics', 'Electronic devices and accessories'),
  ('Kitchen', 'Kitchen utensils and appliances'),
  ('Tools', 'Hand tools and equipment'),
  ('Clothing', 'Clothing and accessories'),
  ('Books', 'Books and reading materials'),
  ('Miscellaneous', 'Other items')
) AS categories(category_name, category_description)
WHERE h.invitation_code = 'DEMO123'
ON CONFLICT DO NOTHING;

-- Verify the fix worked
SELECT 
  u.email,
  h.name as household_name,
  hm.role,
  (SELECT COUNT(*) FROM rooms WHERE household_id = h.id) as room_count,
  (SELECT COUNT(*) FROM categories WHERE household_id = h.id) as category_count
FROM users u
JOIN household_members hm ON u.id = hm.user_id
JOIN households h ON hm.household_id = h.id
WHERE u.email = 'demo@smartwarehouse.com';
