-- SQL for Issue 3: Household Messaging Enhancements
-- Run these in Supabase SQL Editor

-- ============================================
-- 1. Add communityId to Conversation table (if not exists)
-- ============================================
-- This allows conversations to be linked to communities for cross-communication

DO $$ 
BEGIN
  -- Check if column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'community_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN community_id TEXT;
    
    -- Add foreign key constraint
    ALTER TABLE conversations 
    ADD CONSTRAINT conversations_community_id_fkey 
    FOREIGN KEY (community_id) REFERENCES communities(id) 
    ON DELETE CASCADE ON UPDATE NO ACTION;
    
    -- Add index for performance
    CREATE INDEX IF NOT EXISTS conversations_community_id_idx ON conversations(community_id);
    
    RAISE NOTICE 'Added community_id column to conversations table';
  ELSE
    RAISE NOTICE 'Column community_id already exists in conversations table';
  END IF;
END $$;

-- ============================================
-- 2. Add type for admin-household conversations
-- ============================================
-- Update existing conversations to use 'admin_household' type if they were created by admins
-- This is a data migration, no schema change needed

-- ============================================
-- 3. Function to auto-create conversations for active households
-- ============================================
-- This function can be called from the API to ensure all active households have conversations

CREATE OR REPLACE FUNCTION ensure_household_conversations(
  p_building_id TEXT DEFAULT NULL,
  p_community_id TEXT DEFAULT NULL,
  p_admin_user_id TEXT
)
RETURNS TABLE(
  created_count INTEGER,
  existing_count INTEGER
) AS $$
DECLARE
  v_created_count INTEGER := 0;
  v_existing_count INTEGER := 0;
  v_household RECORD;
  v_conversation_id TEXT;
BEGIN
  -- Loop through households based on context
  IF p_building_id IS NOT NULL THEN
    -- Get all active households in the building
    FOR v_household IN 
      SELECT DISTINCT h.id, h.name, h.building_id
      FROM households h
      INNER JOIN household_members hm ON hm.household_id = h.id
      WHERE h.building_id = p_building_id
        AND EXISTS (
          SELECT 1 FROM household_members hm2 
          WHERE hm2.household_id = h.id
        ) -- Has at least one member (active)
    LOOP
      -- Check if conversation exists
      SELECT id INTO v_conversation_id
      FROM conversations
      WHERE household_id = v_household.id
        AND building_id = p_building_id
        AND type = 'admin_household'
        AND created_by = p_admin_user_id
      LIMIT 1;
      
      IF v_conversation_id IS NULL THEN
        -- Create conversation
        INSERT INTO conversations (
          household_id,
          building_id,
          created_by,
          type,
          status,
          created_at,
          updated_at
        ) VALUES (
          v_household.id,
          p_building_id,
          p_admin_user_id,
          'admin_household',
          'active',
          NOW(),
          NOW()
        );
        v_created_count := v_created_count + 1;
      ELSE
        v_existing_count := v_existing_count + 1;
      END IF;
    END LOOP;
    
  ELSIF p_community_id IS NOT NULL THEN
    -- Get all active households in all buildings of the community
    FOR v_household IN 
      SELECT DISTINCT h.id, h.name, h.building_id, b.community_id
      FROM households h
      INNER JOIN buildings b ON b.id = h.building_id
      INNER JOIN household_members hm ON hm.household_id = h.id
      WHERE b.community_id = p_community_id
        AND EXISTS (
          SELECT 1 FROM household_members hm2 
          WHERE hm2.household_id = h.id
        ) -- Has at least one member (active)
    LOOP
      -- Check if conversation exists
      SELECT id INTO v_conversation_id
      FROM conversations
      WHERE household_id = v_household.id
        AND building_id = v_household.building_id
        AND community_id = p_community_id
        AND type = 'admin_household'
        AND created_by = p_admin_user_id
      LIMIT 1;
      
      IF v_conversation_id IS NULL THEN
        -- Create conversation
        INSERT INTO conversations (
          household_id,
          building_id,
          community_id,
          created_by,
          type,
          status,
          created_at,
          updated_at
        ) VALUES (
          v_household.id,
          v_household.building_id,
          p_community_id,
          p_admin_user_id,
          'admin_household',
          'active',
          NOW(),
          NOW()
        );
        v_created_count := v_created_count + 1;
      ELSE
        v_existing_count := v_existing_count + 1;
      END IF;
    END LOOP;
  END IF;
  
  RETURN QUERY SELECT v_created_count, v_existing_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Add index for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS conversations_type_idx ON conversations(type);
CREATE INDEX IF NOT EXISTS conversations_status_idx ON conversations(status);
CREATE INDEX IF NOT EXISTS conversations_household_building_idx ON conversations(household_id, building_id);
CREATE INDEX IF NOT EXISTS conversations_household_community_idx ON conversations(household_id, community_id);

-- ============================================
-- 5. Add helper function to get active household count
-- ============================================
CREATE OR REPLACE FUNCTION get_active_household_count(
  p_building_id TEXT DEFAULT NULL,
  p_community_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_building_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT h.id) INTO v_count
    FROM households h
    WHERE h.building_id = p_building_id
      AND EXISTS (
        SELECT 1 FROM household_members hm 
        WHERE hm.household_id = h.id
      );
  ELSIF p_community_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT h.id) INTO v_count
    FROM households h
    INNER JOIN buildings b ON b.id = h.building_id
    WHERE b.community_id = p_community_id
      AND EXISTS (
        SELECT 1 FROM household_members hm 
        WHERE hm.household_id = h.id
      );
  ELSE
    v_count := 0;
  END IF;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Migration: Create conversations for existing active households
-- ============================================
-- This is a one-time migration. Run manually for each building/community admin.
-- Example usage:
-- SELECT * FROM ensure_household_conversations('building-id-here', NULL, 'admin-user-id-here');
-- SELECT * FROM ensure_household_conversations(NULL, 'community-id-here', 'admin-user-id-here');

-- ============================================
-- Verification Queries
-- ============================================

-- Check conversations by building
-- SELECT COUNT(*) as total_conversations, 
--        COUNT(DISTINCT household_id) as unique_households
-- FROM conversations 
-- WHERE building_id = 'your-building-id' AND type = 'admin_household';

-- Check active households vs conversations
-- SELECT 
--   (SELECT COUNT(DISTINCT h.id) 
--    FROM households h 
--    WHERE h.building_id = 'your-building-id'
--      AND EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = h.id)
--   ) as active_households,
--   (SELECT COUNT(DISTINCT household_id) 
--    FROM conversations 
--    WHERE building_id = 'your-building-id' AND type = 'admin_household'
--   ) as conversations_count;
