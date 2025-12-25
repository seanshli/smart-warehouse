-- Check if check_routing_consistency constraint exists
-- This constraint likely ensures:
-- - If routing_type = 'EXTERNAL_SUPPLIER', then assigned_supplier_id must NOT be null
-- - If routing_type IN ('INTERNAL_BUILDING', 'INTERNAL_COMMUNITY'), then assigned_supplier_id must be null

-- Check constraint definition
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'maintenance_tickets'::regclass
  AND conname LIKE '%routing%';

-- If constraint doesn't exist or needs to be fixed, use this:
-- ALTER TABLE maintenance_tickets 
-- DROP CONSTRAINT IF EXISTS check_routing_consistency;

-- ALTER TABLE maintenance_tickets
-- ADD CONSTRAINT check_routing_consistency 
-- CHECK (
--   (routing_type = 'EXTERNAL_SUPPLIER' AND assigned_supplier_id IS NOT NULL) OR
--   (routing_type IN ('INTERNAL_BUILDING', 'INTERNAL_COMMUNITY') AND assigned_supplier_id IS NULL) OR
--   (routing_type IS NULL)
-- );
