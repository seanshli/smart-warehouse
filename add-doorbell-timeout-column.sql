-- Add doorbell timeout configuration to buildings table
ALTER TABLE "buildings" 
ADD COLUMN IF NOT EXISTS "doorbell_timeout_seconds" INTEGER DEFAULT 30;

-- Add routed_to_frontdesk field to doorbell call sessions
ALTER TABLE "door_bell_call_sessions"
ADD COLUMN IF NOT EXISTS "routed_to_frontdesk" BOOLEAN DEFAULT false;

-- Add routed_at timestamp
ALTER TABLE "door_bell_call_sessions"
ADD COLUMN IF NOT EXISTS "routed_at" TIMESTAMPTZ(6);

-- Create index for efficient querying of ringing calls that need routing
CREATE INDEX IF NOT EXISTS "idx_door_bell_call_sessions_routing" 
ON "door_bell_call_sessions"("status", "started_at", "routed_to_frontdesk")
WHERE "status" = 'ringing' AND "routed_to_frontdesk" = false;


