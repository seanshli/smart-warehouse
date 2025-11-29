-- Add Front Door and Facilities Schema
-- This script adds tables for door bells, package lockers, packages, facilities, operating hours, and reservations

-- Door Bells table
CREATE TABLE IF NOT EXISTS door_bells (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  household_id TEXT REFERENCES households(id) ON DELETE SET NULL,
  door_bell_number TEXT NOT NULL,
  location TEXT DEFAULT 'Front Door',
  is_enabled BOOLEAN DEFAULT true,
  last_rung_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(building_id, door_bell_number)
);

CREATE INDEX IF NOT EXISTS idx_door_bells_building_id ON door_bells(building_id);
CREATE INDEX IF NOT EXISTS idx_door_bells_household_id ON door_bells(household_id);

-- Package Lockers table
CREATE TABLE IF NOT EXISTS package_lockers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  locker_number INTEGER NOT NULL,
  location TEXT DEFAULT 'Front Door - Package Room',
  is_occupied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(building_id, locker_number)
);

CREATE INDEX IF NOT EXISTS idx_package_lockers_building_id ON package_lockers(building_id);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  locker_id TEXT NOT NULL REFERENCES package_lockers(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  package_number TEXT,
  description TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_out_at TIMESTAMP WITH TIME ZONE,
  checked_in_by TEXT,
  checked_out_by TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_building_id ON packages(building_id);
CREATE INDEX IF NOT EXISTS idx_packages_locker_id ON packages(locker_id);
CREATE INDEX IF NOT EXISTS idx_packages_household_id ON packages(household_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);

-- Facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  floor_id TEXT REFERENCES floors(id) ON DELETE SET NULL,
  floor_number INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(building_id, name)
);

CREATE INDEX IF NOT EXISTS idx_facilities_building_id ON facilities(building_id);
CREATE INDEX IF NOT EXISTS idx_facilities_floor_id ON facilities(floor_id);

-- Facility Operating Hours table
CREATE TABLE IF NOT EXISTS facility_operating_hours (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  open_time TEXT NOT NULL,
  close_time TEXT NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(facility_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_facility_operating_hours_facility_id ON facility_operating_hours(facility_id);

-- Facility Reservations table
CREATE TABLE IF NOT EXISTS facility_reservations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  access_code TEXT,
  purpose TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facility_reservations_facility_id ON facility_reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_reservations_household_id ON facility_reservations(household_id);
CREATE INDEX IF NOT EXISTS idx_facility_reservations_status ON facility_reservations(status);
CREATE INDEX IF NOT EXISTS idx_facility_reservations_time ON facility_reservations(facility_id, start_time, end_time);

-- Update notifications table to add new foreign key columns
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS door_bell_id TEXT REFERENCES door_bells(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS package_id TEXT REFERENCES packages(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS facility_reservation_id TEXT REFERENCES facility_reservations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_door_bell_id ON notifications(door_bell_id);
CREATE INDEX IF NOT EXISTS idx_notifications_package_id ON notifications(package_id);
CREATE INDEX IF NOT EXISTS idx_notifications_facility_reservation_id ON notifications(facility_reservation_id);

-- Update floors table to add facilities relation (already exists via schema)
-- Update buildings table to add new relations (already exists via schema)
-- Update households table to add new relations (already exists via schema)


