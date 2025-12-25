-- Add SupplierMember table for supplier admin access
-- This allows users to be admins/managers for specific suppliers

CREATE TABLE IF NOT EXISTS supplier_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER', -- ADMIN, MANAGER, MEMBER, VIEWER
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_members_user_id ON supplier_members(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_members_supplier_id ON supplier_members(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_members_role ON supplier_members(role);

-- Add comment
COMMENT ON TABLE supplier_members IS 'Links users to suppliers for supplier admin access';
COMMENT ON COLUMN supplier_members.role IS 'ADMIN, MANAGER, MEMBER, or VIEWER - determines access level';
