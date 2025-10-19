-- Add isAdmin column to users table
-- This script adds the isAdmin column to the existing users table

-- First, add the column with a default value of false
ALTER TABLE users ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Update existing admin users to have isAdmin = true
-- Update your account to be admin
UPDATE users SET "isAdmin" = true WHERE email = 'seanshlitw@gmail.com';

-- Create the admin user if it doesn't exist
INSERT INTO users (id, email, name, "isAdmin", "created_at", "updated_at")
VALUES (
  gen_random_uuid()::text,
  'admin@smartwarehouse.com',
  'System Administrator',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET "isAdmin" = true;

-- Verify the changes
SELECT id, email, name, "isAdmin", "created_at" FROM users WHERE "isAdmin" = true;
