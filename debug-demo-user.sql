-- Debug demo user data
-- Run this in Supabase SQL Editor

-- Check demo user and household association
SELECT 
  u.email,
  u.id as user_id,
  u.name,
  h.id as household_id,
  h.name as household_name,
  hm.role,
  hm.joined_at
FROM users u
LEFT JOIN household_members hm ON u.id = hm.user_id
LEFT JOIN households h ON hm.household_id = h.id
WHERE u.email = 'demo@smartwarehouse.com';

-- Check if there are any rooms for the demo household
SELECT 
  h.name as household_name,
  r.id as room_id,
  r.name as room_name,
  r.description
FROM households h
LEFT JOIN rooms r ON h.id = r.household_id
WHERE h.name = 'Demo Household'
ORDER BY r.name;

-- Check if there are any categories for the demo household
SELECT 
  h.name as household_name,
  c.id as category_id,
  c.name as category_name,
  c.description,
  c.level
FROM households h
LEFT JOIN categories cat ON h.id = cat.household_id
WHERE h.name = 'Demo Household'
ORDER BY c.level, c.name;

-- Check total counts for demo household
SELECT 
  h.name as household_name,
  (SELECT COUNT(*) FROM rooms WHERE household_id = h.id) as room_count,
  (SELECT COUNT(*) FROM categories WHERE household_id = h.id) as category_count,
  (SELECT COUNT(*) FROM items WHERE household_id = h.id) as item_count,
  (SELECT COUNT(*) FROM household_members WHERE household_id = h.id) as member_count
FROM households h
WHERE h.name = 'Demo Household';
