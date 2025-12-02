-- Create doorbell call sessions table
CREATE TABLE IF NOT EXISTS "door_bell_call_sessions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "door_bell_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ringing',
  "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "connected_at" TIMESTAMPTZ(6),
  "ended_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "door_bell_call_sessions_door_bell_id_fkey" 
    FOREIGN KEY ("door_bell_id") 
    REFERENCES "door_bells"("id") 
    ON DELETE CASCADE 
    ON UPDATE NO ACTION
);

-- Create doorbell messages table
CREATE TABLE IF NOT EXISTS "door_bell_messages" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "call_session_id" TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "door_bell_messages_call_session_id_fkey" 
    FOREIGN KEY ("call_session_id") 
    REFERENCES "door_bell_call_sessions"("id") 
    ON DELETE CASCADE 
    ON UPDATE NO ACTION
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_door_bell_call_sessions_door_bell_id" 
  ON "door_bell_call_sessions"("door_bell_id");
CREATE INDEX IF NOT EXISTS "idx_door_bell_call_sessions_status" 
  ON "door_bell_call_sessions"("status");
CREATE INDEX IF NOT EXISTS "idx_door_bell_messages_call_session_id" 
  ON "door_bell_messages"("call_session_id");

-- Add updated_at trigger for door_bell_call_sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_door_bell_call_sessions_updated_at
  BEFORE UPDATE ON "door_bell_call_sessions"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

