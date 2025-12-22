-- Add workgroup support to catering orders
-- This allows orders to be channeled through workgroups
-- Run this in Supabase SQL Editor

-- Add workgroupId column to catering_orders table
ALTER TABLE catering_orders
ADD COLUMN IF NOT EXISTS workgroup_id TEXT;

-- Add foreign key constraint
ALTER TABLE catering_orders
ADD CONSTRAINT fk_catering_order_workgroup
FOREIGN KEY (workgroup_id) REFERENCES working_groups(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_catering_orders_workgroup_id ON catering_orders(workgroup_id);

-- Comment
COMMENT ON COLUMN catering_orders.workgroup_id IS 'Workgroup assigned to handle this order';
