-- ============================================================================
-- Maintenance Ticket System (報修) - Complete SQL Migration
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- 1. Create Suppliers table (external vendors like enGo, appliance repair, etc.)
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    service_types TEXT[], -- Array of service types: ['appliance', 'water_filter', 'smart_home', etc.]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Working Crews table (internal crews for building/community)
CREATE TABLE IF NOT EXISTS working_crews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    crew_type TEXT NOT NULL, -- 'BUILDING_MAINTENANCE', 'HOUSE_CLEANING', 'FOOD_ORDER', 'CAR_SERVICE', etc.
    building_id TEXT REFERENCES buildings(id) ON DELETE CASCADE,
    community_id TEXT REFERENCES communities(id) ON DELETE CASCADE,
    crew_lead_id TEXT REFERENCES users(id) ON DELETE SET NULL, -- Crew leader
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure crew belongs to either building or community, not both
    CONSTRAINT check_crew_scope CHECK (
        (building_id IS NOT NULL AND community_id IS NULL) OR
        (building_id IS NULL AND community_id IS NOT NULL)
    )
);

-- 3. Create Crew Members table
CREATE TABLE IF NOT EXISTS crew_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    crew_id TEXT NOT NULL REFERENCES working_crews(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'MEMBER', -- 'LEAD', 'MEMBER'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crew_id, user_id)
);

-- 4. Create Maintenance Tickets table (main work order)
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ticket_number TEXT UNIQUE NOT NULL, -- Auto-generated: MT-YYYYMMDD-XXXX
    household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    requested_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ticket details
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'BUILDING_MAINTENANCE', 'HOUSE_CLEANING', 'FOOD_ORDER', 'CAR_SERVICE', 'APPLIANCE', 'WATER_FILTER', 'SMART_HOME', etc.
    priority TEXT DEFAULT 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
    location TEXT, -- Where the issue is located
    
    -- Workflow state
    status TEXT DEFAULT 'PENDING_EVALUATION', -- 'PENDING_EVALUATION', 'EVALUATED', 'ASSIGNED', 'IN_PROGRESS', 'WORK_COMPLETED', 'SIGNED_OFF_BY_CREW', 'SIGNED_OFF_BY_SUPPLIER', 'SIGNED_OFF_BY_HOUSEHOLD', 'CLOSED', 'CANCELLED'
    
    -- Routing
    routing_type TEXT, -- 'INTERNAL_BUILDING', 'INTERNAL_COMMUNITY', 'EXTERNAL_SUPPLIER'
    assigned_crew_id TEXT REFERENCES working_crews(id) ON DELETE SET NULL,
    assigned_supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
    assigned_worker_id TEXT REFERENCES users(id) ON DELETE SET NULL, -- Specific worker assigned
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    evaluated_at TIMESTAMP WITH TIME ZONE,
    evaluated_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    work_started_at TIMESTAMP WITH TIME ZONE,
    work_completed_at TIMESTAMP WITH TIME ZONE,
    crew_signoff_at TIMESTAMP WITH TIME ZONE,
    crew_signoff_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    supplier_signoff_at TIMESTAMP WITH TIME ZONE,
    supplier_signoff_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    household_signoff_at TIMESTAMP WITH TIME ZONE,
    household_signoff_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure routing is consistent
    CONSTRAINT check_routing_consistency CHECK (
        (routing_type = 'INTERNAL_BUILDING' AND assigned_crew_id IS NOT NULL AND assigned_supplier_id IS NULL) OR
        (routing_type = 'INTERNAL_COMMUNITY' AND assigned_crew_id IS NOT NULL AND assigned_supplier_id IS NULL) OR
        (routing_type = 'EXTERNAL_SUPPLIER' AND assigned_supplier_id IS NOT NULL AND assigned_crew_id IS NULL) OR
        (routing_type IS NULL)
    )
);

-- 5. Create Maintenance Ticket Work Logs table (documentation of work done)
CREATE TABLE IF NOT EXISTS maintenance_ticket_work_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ticket_id TEXT NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    logged_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    work_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    work_description TEXT NOT NULL, -- What work was done
    hours_worked DECIMAL(5,2), -- Hours spent
    materials_used TEXT, -- Materials/parts used
    notes TEXT, -- Additional notes
    attachments TEXT[], -- Array of attachment URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Maintenance Ticket Sign-offs table (detailed sign-off records)
CREATE TABLE IF NOT EXISTS maintenance_ticket_signoffs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ticket_id TEXT NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    signoff_type TEXT NOT NULL, -- 'CREW_LEAD', 'SUPPLIER_LEAD', 'HOUSEHOLD'
    signed_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    comments TEXT, -- Sign-off comments
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 rating (optional)
    attachments TEXT[], -- Array of attachment URLs (photos, documents)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_household ON maintenance_tickets(household_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_status ON maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_assigned_crew ON maintenance_tickets(assigned_crew_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_assigned_supplier ON maintenance_tickets(assigned_supplier_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_requested_by ON maintenance_tickets(requested_by_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_category ON maintenance_tickets(category);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_routing_type ON maintenance_tickets(routing_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_assigned_worker ON maintenance_tickets(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_requested_at ON maintenance_tickets(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_work_logs_ticket ON maintenance_ticket_work_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_logged_by ON maintenance_ticket_work_logs(logged_by_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_work_date ON maintenance_ticket_work_logs(work_date DESC);

CREATE INDEX IF NOT EXISTS idx_signoffs_ticket ON maintenance_ticket_signoffs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_signoffs_signed_by ON maintenance_ticket_signoffs(signed_by_id);
CREATE INDEX IF NOT EXISTS idx_signoffs_type ON maintenance_ticket_signoffs(signoff_type);
CREATE INDEX IF NOT EXISTS idx_signoffs_signed_at ON maintenance_ticket_signoffs(signed_at DESC);

CREATE INDEX IF NOT EXISTS idx_working_crews_building ON working_crews(building_id);
CREATE INDEX IF NOT EXISTS idx_working_crews_community ON working_crews(community_id);
CREATE INDEX IF NOT EXISTS idx_working_crews_crew_type ON working_crews(crew_type);
CREATE INDEX IF NOT EXISTS idx_working_crews_crew_lead ON working_crews(crew_lead_id);

CREATE INDEX IF NOT EXISTS idx_crew_members_crew ON crew_members(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_user ON crew_members(user_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_service_types ON suppliers USING GIN(service_types);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active) WHERE is_active = true;

-- 8. Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    ticket_num TEXT;
    date_part TEXT;
    seq_num INTEGER;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get the next sequence number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 12) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM maintenance_tickets
    WHERE ticket_number LIKE 'MT-' || date_part || '-%';
    
    ticket_num := 'MT-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON maintenance_tickets;
CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON maintenance_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- 10. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON suppliers;
CREATE TRIGGER trigger_update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_working_crews_updated_at ON working_crews;
CREATE TRIGGER trigger_update_working_crews_updated_at
    BEFORE UPDATE ON working_crews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_maintenance_tickets_updated_at ON maintenance_tickets;
CREATE TRIGGER trigger_update_maintenance_tickets_updated_at
    BEFORE UPDATE ON maintenance_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Add notification support for maintenance tickets
-- Update notifications table to support maintenance tickets
DO $$ 
BEGIN
    -- Add maintenance_ticket_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'maintenance_ticket_id'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN maintenance_ticket_id TEXT REFERENCES maintenance_tickets(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_notifications_maintenance_ticket 
        ON notifications(maintenance_ticket_id);
    END IF;
END $$;

-- 12. Add comments for documentation
COMMENT ON TABLE suppliers IS 'External vendors and service providers (e.g., enGo for appliances, water filters, smart home devices)';
COMMENT ON TABLE working_crews IS 'Internal maintenance crews for buildings and communities (house cleaning, food order, car service, building maintenance)';
COMMENT ON TABLE crew_members IS 'Members of working crews with their roles';
COMMENT ON TABLE maintenance_tickets IS 'Main work order system for household maintenance requests with complete workflow tracking';
COMMENT ON TABLE maintenance_ticket_work_logs IS 'Documentation of work performed on tickets (work description, hours, materials, notes)';
COMMENT ON TABLE maintenance_ticket_signoffs IS 'Sign-off records for ticket completion (crew lead, supplier lead, household)';

COMMENT ON COLUMN maintenance_tickets.status IS 'Workflow states: PENDING_EVALUATION -> EVALUATED -> ASSIGNED -> IN_PROGRESS -> WORK_COMPLETED -> SIGNED_OFF_BY_CREW/SUPPLIER -> SIGNED_OFF_BY_HOUSEHOLD -> CLOSED';
COMMENT ON COLUMN maintenance_tickets.routing_type IS 'INTERNAL_BUILDING, INTERNAL_COMMUNITY, or EXTERNAL_SUPPLIER';
COMMENT ON COLUMN maintenance_tickets.category IS 'BUILDING_MAINTENANCE, HOUSE_CLEANING, FOOD_ORDER, CAR_SERVICE, APPLIANCE, WATER_FILTER, SMART_HOME, etc.';

-- 13. Create view for ticket summary (optional, useful for reporting)
CREATE OR REPLACE VIEW maintenance_ticket_summary AS
SELECT 
    mt.id,
    mt.ticket_number,
    mt.title,
    mt.category,
    mt.priority,
    mt.status,
    mt.routing_type,
    h.name AS household_name,
    u.name AS requested_by_name,
    u.email AS requested_by_email,
    mt.requested_at,
    mt.evaluated_at,
    mt.assigned_at,
    mt.work_started_at,
    mt.work_completed_at,
    mt.crew_signoff_at,
    mt.supplier_signoff_at,
    mt.household_signoff_at,
    mt.closed_at,
    wc.name AS assigned_crew_name,
    s.name AS assigned_supplier_name,
    COUNT(DISTINCT wl.id) AS work_log_count,
    COUNT(DISTINCT so.id) AS signoff_count
FROM maintenance_tickets mt
LEFT JOIN households h ON mt.household_id = h.id
LEFT JOIN users u ON mt.requested_by_id = u.id
LEFT JOIN working_crews wc ON mt.assigned_crew_id = wc.id
LEFT JOIN suppliers s ON mt.assigned_supplier_id = s.id
LEFT JOIN maintenance_ticket_work_logs wl ON mt.id = wl.ticket_id
LEFT JOIN maintenance_ticket_signoffs so ON mt.id = so.ticket_id
GROUP BY mt.id, h.name, u.name, u.email, wc.name, s.name;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- 
-- Summary:
-- - Created 6 tables: suppliers, working_crews, crew_members, maintenance_tickets,
--   maintenance_ticket_work_logs, maintenance_ticket_signoffs
-- - Created indexes for performance
-- - Created functions for ticket number generation and timestamp updates
-- - Created triggers for auto-generation and updates
-- - Updated notifications table to support maintenance tickets
-- - Created summary view for reporting
--
-- Next Steps:
-- 1. Run: npx prisma generate (to update Prisma client)
-- 2. Create API endpoints
-- 3. Create UI components
-- ============================================================================
