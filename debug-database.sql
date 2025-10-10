-- Debug database state in Supabase SQL Editor
-- Run this to check what's in your database

-- Check users table
SELECT 'USERS' as table_name, id, email, name, language, created_at, updated_at FROM users LIMIT 5;

-- Check households table  
SELECT 'HOUSEHOLDS' as table_name, id, name, description, invitation_code, created_at, updated_at FROM households LIMIT 5;

-- Check household_members table
SELECT 'HOUSEHOLD_MEMBERS' as table_name, id, user_id, household_id, role, joined_at FROM household_members LIMIT 5;

-- Check rooms table
SELECT 'ROOMS' as table_name, id, name, description, household_id, created_at, updated_at FROM rooms LIMIT 5;

-- Check categories table
SELECT 'CATEGORIES' as table_name, id, name, description, level, parent_id, household_id, created_at, updated_at FROM categories LIMIT 5;

-- Check items table
SELECT 'ITEMS' as table_name, id, name, description, quantity, min_quantity, category_id, room_id, cabinet_id, household_id, added_by_id, created_at, updated_at FROM items LIMIT 5;

-- Check if demo user exists and has household membership
SELECT 
  u.email,
  u.name,
  h.name as household_name,
  hm.role,
  hm.joined_at
FROM users u
LEFT JOIN household_members hm ON u.id = hm.user_id
LEFT JOIN households h ON hm.household_id = h.id
WHERE u.email = 'demo@smartwarehouse.com';
