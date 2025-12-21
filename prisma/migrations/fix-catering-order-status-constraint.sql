-- Fix catering_orders status constraint to allow new workflow statuses
-- Run this in Supabase SQL Editor

-- Drop existing constraint if it exists
ALTER TABLE catering_orders 
DROP CONSTRAINT IF EXISTS check_status;

-- Add new constraint with all valid statuses
ALTER TABLE catering_orders
ADD CONSTRAINT check_status 
CHECK (status IN ('submitted', 'accepted', 'preparing', 'ready', 'delivered', 'closed', 'cancelled', 'pending', 'confirmed'));

-- Update any existing 'pending' orders to 'submitted' to match new workflow
UPDATE catering_orders 
SET status = 'submitted' 
WHERE status = 'pending';
