-- SQL for Phase 2: Job Routing Supplier Assignment
-- Run this in Supabase SQL Editor

-- ============================================
-- Create job_routing_config table
-- ============================================
-- This table stores job category routing configuration and supplier assignments

CREATE TABLE IF NOT EXISTS job_routing_config (
  category TEXT PRIMARY KEY,
  routing_type TEXT NOT NULL CHECK (routing_type IN ('INTERNAL_BUILDING', 'INTERNAL_COMMUNITY', 'EXTERNAL_SUPPLIER')),
  supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS job_routing_config_routing_type_idx ON job_routing_config(routing_type);
CREATE INDEX IF NOT EXISTS job_routing_config_supplier_id_idx ON job_routing_config(supplier_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_routing_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_routing_config_updated_at
  BEFORE UPDATE ON job_routing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_job_routing_config_updated_at();

-- ============================================
-- Insert default routing configuration
-- ============================================
-- These are the default routing rules

INSERT INTO job_routing_config (category, routing_type, supplier_id)
VALUES
  ('BUILDING_MAINTENANCE', 'INTERNAL_BUILDING', NULL),
  ('HOUSE_CLEANING', 'INTERNAL_COMMUNITY', NULL),
  ('FOOD_ORDER', 'INTERNAL_COMMUNITY', NULL),
  ('CAR_SERVICE', 'EXTERNAL_SUPPLIER', NULL),
  ('APPLIANCE_REPAIR', 'EXTERNAL_SUPPLIER', NULL),
  ('WATER_FILTER', 'EXTERNAL_SUPPLIER', NULL),
  ('SMART_HOME', 'EXTERNAL_SUPPLIER', NULL),
  ('OTHER', 'INTERNAL_COMMUNITY', NULL)
ON CONFLICT (category) DO NOTHING;

-- ============================================
-- Verification Queries
-- ============================================

-- Check all routing configurations
-- SELECT * FROM job_routing_config ORDER BY category;

-- Check categories with supplier assignments
-- SELECT 
--   jrc.category,
--   jrc.routing_type,
--   s.name as supplier_name,
--   s.service_types
-- FROM job_routing_config jrc
-- LEFT JOIN suppliers s ON s.id = jrc.supplier_id
-- WHERE jrc.routing_type = 'EXTERNAL_SUPPLIER'
-- ORDER BY jrc.category;
