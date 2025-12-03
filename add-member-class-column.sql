-- Add memberClass field to distinguish between household residents and working team members
ALTER TABLE "community_members"
ADD COLUMN IF NOT EXISTS "member_class" TEXT DEFAULT 'household';

ALTER TABLE "building_members"
ADD COLUMN IF NOT EXISTS "member_class" TEXT DEFAULT 'household';

-- Update roles: Change MANAGER/MEMBER/VIEWER to USER/GUEST
-- ADMIN stays as ADMIN
-- For now, we'll keep existing roles but add support for new ones
-- Note: This is a data migration that may need manual review

-- Add comment explaining member_class values
COMMENT ON COLUMN "community_members"."member_class" IS 'household: resident living in a household, building: working team member for building, community: working team member for community';
COMMENT ON COLUMN "building_members"."member_class" IS 'household: resident living in a household, building: working team member for building, community: working team member for community';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS "idx_community_members_class" ON "community_members"("member_class");
CREATE INDEX IF NOT EXISTS "idx_building_members_class" ON "building_members"("member_class");

