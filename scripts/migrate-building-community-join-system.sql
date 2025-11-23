-- Migration script for Building and Community join system
-- 为 Building 和 Community 加入系统创建迁移脚本
--
-- 使用方法: 在 Supabase SQL Editor 中运行此脚本
--
-- 注意: 此脚本会:
--   1. 确保 Building.invitationCode 字段存在
--   2. 确保 BuildingMember 表存在
--   3. 确保 CommunityMember.isAutoJoined 字段存在
--   4. 确保 BuildingMember.isAutoJoined 字段存在
--   5. 创建 JoinRequest 表

-- 1. 确保 Building.invitationCode 字段存在
ALTER TABLE buildings
ADD COLUMN IF NOT EXISTS invitation_code TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- 2. 确保 BuildingMember 表存在
CREATE TABLE IF NOT EXISTS building_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  role TEXT DEFAULT 'MEMBER', -- ADMIN, MANAGER, MEMBER, VIEWER
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_auto_joined BOOLEAN DEFAULT false,
  UNIQUE(user_id, building_id)
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_building_members_user_id ON building_members(user_id);
CREATE INDEX IF NOT EXISTS idx_building_members_building_id ON building_members(building_id);

-- 4. 确保 CommunityMember.isAutoJoined 字段存在
ALTER TABLE community_members
ADD COLUMN IF NOT EXISTS is_auto_joined BOOLEAN DEFAULT false;

-- 5. 确保 BuildingMember.isAutoJoined 字段存在（已在步骤 2 中创建）

-- 6. 创建 JoinRequest 表
CREATE TABLE IF NOT EXISTS join_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  type TEXT NOT NULL, -- 'community' | 'building' | 'household'
  target_id TEXT NOT NULL, -- Community/Building/Household ID
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT, -- User ID who reviewed the request
  UNIQUE(user_id, type, target_id, status)
);

-- 7. 创建索引
CREATE INDEX IF NOT EXISTS idx_join_requests_type_target_status ON join_requests(type, target_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON join_requests(user_id);

-- 8. 验证表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('buildings', 'building_members', 'community_members', 'join_requests')
  AND column_name IN ('invitation_code', 'is_auto_joined', 'type', 'status')
ORDER BY table_name, column_name;

