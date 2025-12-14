-- Add number_of_people column to facility_reservations table
-- Run this in Supabase SQL Editor

ALTER TABLE facility_reservations 
ADD COLUMN IF NOT EXISTS number_of_people INTEGER;

-- Add comment
COMMENT ON COLUMN facility_reservations.number_of_people IS 'Number of people planning to attend';
