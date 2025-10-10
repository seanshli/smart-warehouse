-- Check the actual schema of the households table
-- Run this in Supabase SQL Editor

-- Check what columns exist in households table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'households' 
ORDER BY ordinal_position;

-- Check if invitationCode column exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'households' AND column_name = 'invitation_code'
) as has_invitation_code_column;

-- Check if invitationCode column exists (camelCase)
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'households' AND column_name = 'invitationCode'
) as has_invitationCode_column;
