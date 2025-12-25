-- Fix catering_orders status constraint to allow 'submitted' status
-- Run this in Supabase SQL Editor

-- First, check what the current constraint allows
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'catering_orders'::regclass
AND conname = 'check_status';

-- Drop existing constraint if it exists
ALTER TABLE catering_orders 
DROP CONSTRAINT IF EXISTS check_status;

-- Add new constraint with all valid statuses including 'submitted'
ALTER TABLE catering_orders
ADD CONSTRAINT check_status 
CHECK (status IN ('submitted', 'accepted', 'preparing', 'ready', 'delivered', 'closed', 'cancelled', 'pending', 'confirmed'));

-- Verify the constraint was added
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'catering_orders'::regclass
AND conname = 'check_status';
