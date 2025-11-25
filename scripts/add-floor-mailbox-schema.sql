-- SQL script to add Floor and Mailbox tables to Supabase
-- Run this in Supabase SQL Editor

-- Add floor and unit fields to households table
ALTER TABLE households 
ADD COLUMN IF NOT EXISTS floor_id TEXT,
ADD COLUMN IF NOT EXISTS floor_number INTEGER,
ADD COLUMN IF NOT EXISTS unit TEXT;

-- Create floors table
CREATE TABLE IF NOT EXISTS floors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  floor_number INTEGER NOT NULL,
  name TEXT,
  description TEXT,
  is_residential BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ(6) DEFAULT now(),
  updated_at TIMESTAMPTZ(6) DEFAULT now(),
  UNIQUE(building_id, floor_number)
);

-- Create mailboxes table
CREATE TABLE IF NOT EXISTS mailboxes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  floor_id TEXT REFERENCES floors(id) ON DELETE SET NULL ON UPDATE NO ACTION,
  household_id TEXT REFERENCES households(id) ON DELETE SET NULL ON UPDATE NO ACTION,
  mailbox_number TEXT NOT NULL,
  location TEXT,
  has_mail BOOLEAN DEFAULT false,
  last_mail_at TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) DEFAULT now(),
  updated_at TIMESTAMPTZ(6) DEFAULT now(),
  UNIQUE(building_id, mailbox_number)
);

-- Add mailbox_id to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS mailbox_id TEXT REFERENCES mailboxes(id) ON DELETE CASCADE ON UPDATE NO ACTION;

-- Add foreign key from households to floors
ALTER TABLE households 
ADD CONSTRAINT households_floor_id_fkey 
FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_floors_building_id ON floors(building_id);
CREATE INDEX IF NOT EXISTS idx_floors_floor_number ON floors(floor_number);
CREATE INDEX IF NOT EXISTS idx_mailboxes_building_id ON mailboxes(building_id);
CREATE INDEX IF NOT EXISTS idx_mailboxes_household_id ON mailboxes(household_id);
CREATE INDEX IF NOT EXISTS idx_mailboxes_floor_id ON mailboxes(floor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_mailbox_id ON notifications(mailbox_id);
CREATE INDEX IF NOT EXISTS idx_households_floor_id ON households(floor_id);
CREATE INDEX IF NOT EXISTS idx_households_floor_number ON households(floor_number);

