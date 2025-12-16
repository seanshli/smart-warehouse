-- Add photos field to maintenance_tickets table
-- This allows maintenance tickets to include photo attachments

ALTER TABLE maintenance_tickets 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Add index for better query performance if needed
-- CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_photos ON maintenance_tickets USING GIN (photos);

COMMENT ON COLUMN maintenance_tickets.photos IS 'Array of photo URLs or base64 strings attached to the maintenance ticket';
