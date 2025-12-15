-- Maintenance Ticket System Migration
-- Run this in Supabase SQL Editor

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    rating INTEGER, -- 1-5 rating (optional)
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
CREATE INDEX IF NOT EXISTS idx_work_logs_ticket ON maintenance_ticket_work_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_signoffs_ticket ON maintenance_ticket_signoffs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_working_crews_building ON working_crews(building_id);
CREATE INDEX IF NOT EXISTS idx_working_crews_community ON working_crews(community_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_crew ON crew_members(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_user ON crew_members(user_id);

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

CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON maintenance_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- 10. Add comments for documentation
COMMENT ON TABLE maintenance_tickets IS 'Main work order system for household maintenance requests';
COMMENT ON TABLE suppliers IS 'External vendors and service providers';
COMMENT ON TABLE working_crews IS 'Internal maintenance crews for buildings and communities';
COMMENT ON TABLE maintenance_ticket_work_logs IS 'Documentation of work performed on tickets';
COMMENT ON TABLE maintenance_ticket_signoffs IS 'Sign-off records for ticket completion';
