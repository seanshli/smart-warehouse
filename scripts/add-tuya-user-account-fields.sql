-- Add Tuya account fields to users table
-- Run this in Supabase SQL Editor

-- Add Tuya account fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tuya_account TEXT,
ADD COLUMN IF NOT EXISTS tuya_password TEXT,
ADD COLUMN IF NOT EXISTS tuya_country_code TEXT DEFAULT '1',
ADD COLUMN IF NOT EXISTS tuya_access_token TEXT,
ADD COLUMN IF NOT EXISTS tuya_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN users.tuya_account IS 'Tuya account (email or phone number) - per member';
COMMENT ON COLUMN users.tuya_password IS 'Encrypted Tuya password - per member';
COMMENT ON COLUMN users.tuya_country_code IS 'Country code for Tuya login (e.g., "1" for US, "86" for China)';
COMMENT ON COLUMN users.tuya_access_token IS 'Tuya access token (encrypted, temporary)';
COMMENT ON COLUMN users.tuya_token_expires_at IS 'Token expiration time';

