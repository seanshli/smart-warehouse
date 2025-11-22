-- Migration script for Community and Building hierarchy
-- Execute this directly in Supabase Dashboard SQL Editor
-- This script is safe to run multiple times (uses IF NOT EXISTS)

-- 1. Create communities table
CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  district TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  invitation_code TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- 2. Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  floor_count INTEGER,
  unit_count INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- 3. Add building_id to households (nullable for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'households' AND column_name = 'building_id'
  ) THEN
    ALTER TABLE households 
    ADD COLUMN building_id TEXT REFERENCES buildings(id) ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

-- 4. Create community_members table
CREATE TABLE IF NOT EXISTS community_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  role TEXT DEFAULT 'MEMBER',
  joined_at TIMESTAMPTZ(6) DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

-- 5. Create working_groups table
CREATE TABLE IF NOT EXISTS working_groups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- 6. Create working_group_members table
CREATE TABLE IF NOT EXISTS working_group_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  working_group_id TEXT NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  role TEXT DEFAULT 'MEMBER',
  assigned_at TIMESTAMPTZ(6) DEFAULT NOW(),
  UNIQUE(working_group_id, user_id)
);

-- 7. Create working_group_permissions table
CREATE TABLE IF NOT EXISTS working_group_permissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  working_group_id TEXT NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  permission TEXT NOT NULL,
  scope TEXT,
  scope_id TEXT,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  UNIQUE(working_group_id, permission, scope, scope_id)
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_buildings_community_id ON buildings(community_id);
CREATE INDEX IF NOT EXISTS idx_households_building_id ON households(building_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_working_groups_community_id ON working_groups(community_id);
CREATE INDEX IF NOT EXISTS idx_working_group_members_working_group_id ON working_group_members(working_group_id);
CREATE INDEX IF NOT EXISTS idx_working_group_members_user_id ON working_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_working_group_permissions_working_group_id ON working_group_permissions(working_group_id);

-- 9. Add comments for documentation
COMMENT ON TABLE communities IS 'Communities are the top-level organizational unit';
COMMENT ON TABLE buildings IS 'Buildings belong to communities and contain households';
COMMENT ON TABLE community_members IS 'Users who are members of a community with specific roles';
COMMENT ON TABLE working_groups IS 'Working groups within communities for specific functions (security, maintenance, etc.)';
COMMENT ON TABLE working_group_members IS 'Users assigned to working groups';
COMMENT ON TABLE working_group_permissions IS 'Permissions assigned to working groups with scope (all buildings, specific building, etc.)';

-- 10. Verify tables were created
SELECT 
  'communities' as table_name, 
  COUNT(*) as row_count 
FROM communities
UNION ALL
SELECT 
  'buildings' as table_name, 
  COUNT(*) as row_count 
FROM buildings
UNION ALL
SELECT 
  'community_members' as table_name, 
  COUNT(*) as row_count 
FROM community_members
UNION ALL
SELECT 
  'working_groups' as table_name, 
  COUNT(*) as row_count 
FROM working_groups
UNION ALL
SELECT 
  'working_group_members' as table_name, 
  COUNT(*) as row_count 
FROM working_group_members
UNION ALL
SELECT 
  'working_group_permissions' as table_name, 
  COUNT(*) as row_count 
FROM working_group_permissions;

