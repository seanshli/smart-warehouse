-- Add missing user fields for admin user management
-- Run this script to add phone, contact, password, and force_password_change fields

-- Add phone field
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255);

-- Add contact field  
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact TEXT;

-- Add password field
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Add force_password_change field
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;

-- Add index for phone field for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Add index for force_password_change field
CREATE INDEX IF NOT EXISTS idx_users_force_password_change ON users(force_password_change);

-- Update existing users to have default values
UPDATE users SET force_password_change = FALSE WHERE force_password_change IS NULL;
