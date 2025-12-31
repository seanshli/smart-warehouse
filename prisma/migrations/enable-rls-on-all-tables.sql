-- Enable Row Level Security (RLS) on all public tables
-- This migration enables RLS and creates appropriate policies for each table
-- Service role (used by Prisma) can bypass RLS, but PostgREST API access is protected

-- ============================================
-- Helper Functions
-- ============================================
-- Note: Supabase provides built-in auth functions (auth.uid(), auth.email(), etc.)
-- If those don't exist, we'll create fallback functions
-- For service role check, we'll use the JWT role claim

-- Function to get current user email from JWT (fallback if Supabase's auth.email() doesn't exist)
CREATE OR REPLACE FUNCTION public.get_user_email() RETURNS text AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::json->>'email', ''),
    NULLIF(current_setting('request.jwt.claims', true)::json->>'https://supabase.co/user_metadata'->>'email', '')
  );
$$ LANGUAGE sql STABLE;

-- Function to check if current user is service role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_service_role() RETURNS boolean AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role',
    false
  );
$$ LANGUAGE sql STABLE;

-- ============================================
-- Enable RLS on All Tables
-- ============================================

-- NextAuth tables (very restrictive - only service role)
ALTER TABLE IF EXISTS public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.Account ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.Session ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.VerificationToken ENABLE ROW LEVEL SECURITY;

-- User credentials (very restrictive - only service role)
ALTER TABLE IF EXISTS public.user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.UserCredentials ENABLE ROW LEVEL SECURITY;

-- User tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.User ENABLE ROW LEVEL SECURITY;

-- Household and related tables
ALTER TABLE IF EXISTS public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.Household ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.HouseholdMember ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.Room ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cabinets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.Cabinet ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.Category ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.Item ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.Activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.Notification ENABLE ROW LEVEL SECURITY;

-- Community and Building tables
ALTER TABLE IF EXISTS public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.building_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.door_bells ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.package_lockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.facility_operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.facility_reservations ENABLE ROW LEVEL SECURITY;

-- Working Groups
ALTER TABLE IF EXISTS public.working_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.working_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.working_group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.join_requests ENABLE ROW LEVEL SECURITY;

-- Door Bell and Communication
ALTER TABLE IF EXISTS public.door_bell_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.door_bell_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_history ENABLE ROW LEVEL SECURITY;

-- Maintenance and Work Orders
ALTER TABLE IF EXISTS public.working_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance_ticket_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance_ticket_signoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_routing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supplier_members ENABLE ROW LEVEL SECURITY;

-- Catering
ALTER TABLE IF EXISTS public.catering_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catering_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catering_category_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catering_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catering_menu_item_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catering_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catering_order_items ENABLE ROW LEVEL SECURITY;

-- IoT and Automation
ALTER TABLE IF EXISTS public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.home_assistant_configs ENABLE ROW LEVEL SECURITY;

-- Announcements
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: Service Role Bypass
-- ============================================
-- Service role (used by Prisma) can access everything
-- This ensures Prisma continues to work normally

DO $$ 
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'accounts', 'sessions', 'verification_tokens', 'Account', 'Session', 'VerificationToken',
        'user_credentials', 'UserCredentials',
        'users', 'User',
        'households', 'Household', 'household_members', 'HouseholdMember',
        'rooms', 'Room', 'cabinets', 'Cabinet', 'categories', 'Category',
        'items', 'Item', 'item_history', 'user_activities', 'Activity',
        'barcodes', 'notifications', 'Notification',
        'communities', 'buildings', 'community_members', 'building_members',
        'floors', 'mailboxes', 'door_bells', 'package_lockers', 'packages',
        'facilities', 'facility_operating_hours', 'facility_reservations',
        'working_groups', 'working_group_members', 'working_group_permissions',
        'join_requests', 'door_bell_call_sessions', 'door_bell_messages',
        'call_sessions', 'conversations', 'chat_history',
        'working_crews', 'crew_members', 'maintenance_tickets',
        'maintenance_ticket_work_logs', 'maintenance_ticket_signoffs',
        'job_routing_config', 'suppliers', 'supplier_members',
        'catering_services', 'catering_categories', 'catering_category_time_slots',
        'catering_menu_items', 'catering_menu_item_time_slots',
        'catering_orders', 'catering_order_items',
        'iot_devices', 'home_assistant_configs',
        'announcements', 'announcement_reads'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        -- Drop existing policy if it exists
        EXECUTE format('DROP POLICY IF EXISTS service_role_all_access ON public.%I', table_name);
        
        -- Create policy for service role
        EXECUTE format('
            CREATE POLICY service_role_all_access ON public.%I
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)
        ', table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: NextAuth Tables (Restrictive)
-- ============================================
-- Only service role can access NextAuth tables

-- Accounts
CREATE POLICY IF NOT EXISTS accounts_service_only ON public.accounts
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY IF NOT EXISTS Account_service_only ON public."Account"
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

-- Sessions
CREATE POLICY IF NOT EXISTS sessions_service_only ON public.sessions
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY IF NOT EXISTS Session_service_only ON public."Session"
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

-- Verification Tokens
CREATE POLICY IF NOT EXISTS verification_tokens_service_only ON public.verification_tokens
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY IF NOT EXISTS VerificationToken_service_only ON public."VerificationToken"
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

-- ============================================
-- RLS Policies: User Credentials (Very Restrictive)
-- ============================================
-- Only service role can access user credentials

CREATE POLICY IF NOT EXISTS user_credentials_service_only ON public.user_credentials
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY IF NOT EXISTS UserCredentials_service_only ON public."UserCredentials"
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

-- ============================================
-- RLS Policies: Users Table
-- ============================================
-- Users can read their own data, admins can read all
-- Only service role can write

-- Allow users to read their own user record
-- Try Supabase's auth.email() first, fallback to custom function
CREATE POLICY IF NOT EXISTS users_read_own ON public.users
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT id FROM public.users 
            WHERE email = COALESCE(
                (SELECT auth.email()),
                public.get_user_email()
            )
        )
    );

CREATE POLICY IF NOT EXISTS User_read_own ON public."User"
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT id FROM public."User" 
            WHERE email = auth.email()
        )
    );

-- Block all writes from PostgREST (only service role can write)
CREATE POLICY IF NOT EXISTS users_no_write ON public.users
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY IF NOT EXISTS User_no_write ON public."User"
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

-- ============================================
-- RLS Policies: Household Tables
-- ============================================
-- Household members can access their household's data
-- Admins can access all

-- Households: Members can read their household
CREATE POLICY IF NOT EXISTS households_read_member ON public.households
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS Household_read_member ON public."Household"
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT household_id FROM public."HouseholdMember" hm
            JOIN public."User" u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

-- Household Members: Users can read their own memberships
CREATE POLICY IF NOT EXISTS household_members_read_own ON public.household_members
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
        OR household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS HouseholdMember_read_own ON public."HouseholdMember"
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public."User" WHERE email = auth.email()
        )
        OR household_id IN (
            SELECT household_id FROM public."HouseholdMember" hm
            JOIN public."User" u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

-- Rooms, Cabinets, Categories, Items: Members can access their household's data
CREATE POLICY IF NOT EXISTS rooms_read_household ON public.rooms
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS Room_read_household ON public."Room"
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public."HouseholdMember" hm
            JOIN public."User" u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS cabinets_read_household ON public.cabinets
    FOR SELECT TO authenticated
    USING (
        room_id IN (
            SELECT r.id FROM public.rooms r
            JOIN public.household_members hm ON r.household_id = hm.household_id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS Cabinet_read_household ON public."Cabinet"
    FOR SELECT TO authenticated
    USING (
        room_id IN (
            SELECT r.id FROM public."Room" r
            JOIN public."HouseholdMember" hm ON r.household_id = hm.household_id
            JOIN public."User" u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS categories_read_household ON public.categories
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS Category_read_household ON public."Category"
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public."HouseholdMember" hm
            JOIN public."User" u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS items_read_household ON public.items
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS Item_read_household ON public."Item"
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public."HouseholdMember" hm
            JOIN public."User" u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS item_history_read_household ON public.item_history
    FOR SELECT TO authenticated
    USING (
        item_id IN (
            SELECT i.id FROM public.items i
            JOIN public.household_members hm ON i.household_id = hm.household_id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS user_activities_read_own ON public.user_activities
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS Activity_read_own ON public."Activity"
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public."User" WHERE email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS barcodes_read_own ON public.barcodes
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS notifications_read_own ON public.notifications
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS Notification_read_own ON public."Notification"
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public."User" WHERE email = auth.email()
        )
    );

-- Block all writes from PostgREST for household tables
DO $$ 
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'households', 'Household', 'household_members', 'HouseholdMember',
        'rooms', 'Room', 'cabinets', 'Cabinet', 'categories', 'Category',
        'items', 'Item', 'item_history', 'user_activities', 'Activity',
        'barcodes', 'notifications', 'Notification'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_no_write ON public.%I', table_name, table_name);
        EXECUTE format('
            CREATE POLICY %I_no_write ON public.%I
            FOR INSERT, UPDATE, DELETE TO authenticated, anon
            USING (false)
            WITH CHECK (false)
        ', table_name, table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: Community and Building Tables
-- ============================================
-- Members can read their community/building data
-- Admins can read all

-- Communities: Members can read their community
CREATE POLICY IF NOT EXISTS communities_read_member ON public.communities
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

-- Buildings: Members can read their building
CREATE POLICY IF NOT EXISTS buildings_read_member ON public.buildings
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email()
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email() AND h.building_id IS NOT NULL
        )
    );

-- Community/Building Members: Users can read their own memberships
CREATE POLICY IF NOT EXISTS community_members_read_own ON public.community_members
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
        OR community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS building_members_read_own ON public.building_members
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
        OR building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

-- Floors, Mailboxes, Door Bells, Packages, Facilities: Members can read their building's data
CREATE POLICY IF NOT EXISTS floors_read_building ON public.floors
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email()
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email() AND h.building_id IS NOT NULL
        )
    );

CREATE POLICY IF NOT EXISTS mailboxes_read_building ON public.mailboxes
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email()
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email() AND h.building_id IS NOT NULL
        )
        OR household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS door_bells_read_building ON public.door_bells
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email()
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email() AND h.building_id IS NOT NULL
        )
        OR household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS package_lockers_read_building ON public.package_lockers
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email()
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email() AND h.building_id IS NOT NULL
        )
    );

CREATE POLICY IF NOT EXISTS packages_read_building ON public.packages
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email()
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email() AND h.building_id IS NOT NULL
        )
        OR household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS facilities_read_building ON public.facilities
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email()
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email() AND h.building_id IS NOT NULL
        )
    );

CREATE POLICY IF NOT EXISTS facility_operating_hours_read_building ON public.facility_operating_hours
    FOR SELECT TO authenticated
    USING (
        facility_id IN (
            SELECT f.id FROM public.facilities f
            WHERE f.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = auth.email()
                UNION
                SELECT building_id FROM public.household_members hm
                JOIN public.households h ON hm.household_id = h.id
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = auth.email() AND h.building_id IS NOT NULL
            )
        )
    );

CREATE POLICY IF NOT EXISTS facility_reservations_read_own ON public.facility_reservations
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
        OR facility_id IN (
            SELECT f.id FROM public.facilities f
            WHERE f.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = auth.email()
            )
        )
    );

-- Block all writes from PostgREST for community/building tables
DO $$ 
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'communities', 'buildings', 'community_members', 'building_members',
        'floors', 'mailboxes', 'door_bells', 'package_lockers', 'packages',
        'facilities', 'facility_operating_hours', 'facility_reservations'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_no_write ON public.%I', table_name, table_name);
        EXECUTE format('
            CREATE POLICY %I_no_write ON public.%I
            FOR INSERT, UPDATE, DELETE TO authenticated, anon
            USING (false)
            WITH CHECK (false)
        ', table_name, table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: Working Groups
-- ============================================
-- Members can read their working groups

CREATE POLICY IF NOT EXISTS working_groups_read_member ON public.working_groups
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT working_group_id FROM public.working_group_members wgm
            JOIN public.users u ON wgm.user_id = u.id
            WHERE u.email = auth.email()
        )
        OR community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS working_group_members_read_member ON public.working_group_members
    FOR SELECT TO authenticated
    USING (
        working_group_id IN (
            SELECT working_group_id FROM public.working_group_members wgm
            JOIN public.users u ON wgm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS working_group_permissions_read_member ON public.working_group_permissions
    FOR SELECT TO authenticated
    USING (
        working_group_id IN (
            SELECT working_group_id FROM public.working_group_members wgm
            JOIN public.users u ON wgm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS join_requests_read_own ON public.join_requests
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
        OR target_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = auth.email() AND cm.role = 'ADMIN'
            UNION
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email() AND bm.role = 'ADMIN'
        )
    );

-- Block all writes from PostgREST
DO $$ 
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'working_groups', 'working_group_members', 'working_group_permissions', 'join_requests'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_no_write ON public.%I', table_name, table_name);
        EXECUTE format('
            CREATE POLICY %I_no_write ON public.%I
            FOR INSERT, UPDATE, DELETE TO authenticated, anon
            USING (false)
            WITH CHECK (false)
        ', table_name, table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: Communication Tables
-- ============================================
-- Users can read their own conversations and messages

CREATE POLICY IF NOT EXISTS conversations_read_own ON public.conversations
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
        OR created_by IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS call_sessions_read_own ON public.call_sessions
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
        OR initiator_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS chat_history_read_own ON public.chat_history
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
        OR sender_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS door_bell_call_sessions_read_building ON public.door_bell_call_sessions
    FOR SELECT TO authenticated
    USING (
        door_bell_id IN (
            SELECT db.id FROM public.door_bells db
            WHERE db.household_id IN (
                SELECT household_id FROM public.household_members hm
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = auth.email()
            )
            OR db.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = auth.email()
            )
        )
    );

CREATE POLICY IF NOT EXISTS door_bell_messages_read_building ON public.door_bell_messages
    FOR SELECT TO authenticated
    USING (
        call_session_id IN (
            SELECT dbs.id FROM public.door_bell_call_sessions dbs
            JOIN public.door_bells db ON dbs.door_bell_id = db.id
            WHERE db.household_id IN (
                SELECT household_id FROM public.household_members hm
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = auth.email()
            )
            OR db.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = auth.email()
            )
        )
    );

-- Block all writes from PostgREST
DO $$ 
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'conversations', 'call_sessions', 'chat_history',
        'door_bell_call_sessions', 'door_bell_messages'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_no_write ON public.%I', table_name, table_name);
        EXECUTE format('
            CREATE POLICY %I_no_write ON public.%I
            FOR INSERT, UPDATE, DELETE TO authenticated, anon
            USING (false)
            WITH CHECK (false)
        ', table_name, table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: Maintenance and Work Orders
-- ============================================
-- Users can read tickets for their household
-- Admins can read all tickets

CREATE POLICY IF NOT EXISTS maintenance_tickets_read_household ON public.maintenance_tickets
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
        OR requested_by_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
        OR assigned_worker_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
        OR assigned_crew_id IN (
            SELECT wc.id FROM public.working_crews wc
            JOIN public.crew_members cm ON wc.id = cm.crew_id
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS maintenance_ticket_work_logs_read_ticket ON public.maintenance_ticket_work_logs
    FOR SELECT TO authenticated
    USING (
        ticket_id IN (
            SELECT id FROM public.maintenance_tickets mt
            WHERE mt.household_id IN (
                SELECT household_id FROM public.household_members hm
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = auth.email()
            )
            OR mt.assigned_worker_id IN (
                SELECT id FROM public.users WHERE email = auth.email()
            )
        )
    );

CREATE POLICY IF NOT EXISTS maintenance_ticket_signoffs_read_ticket ON public.maintenance_ticket_signoffs
    FOR SELECT TO authenticated
    USING (
        ticket_id IN (
            SELECT id FROM public.maintenance_tickets mt
            WHERE mt.household_id IN (
                SELECT household_id FROM public.household_members hm
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = auth.email()
            )
        )
    );

CREATE POLICY IF NOT EXISTS working_crews_read_member ON public.working_crews
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT crew_id FROM public.crew_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = auth.email()
        )
        OR building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email()
        )
        OR community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS crew_members_read_member ON public.crew_members
    FOR SELECT TO authenticated
    USING (
        crew_id IN (
            SELECT crew_id FROM public.crew_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS suppliers_read_active ON public.suppliers
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY IF NOT EXISTS supplier_members_read_own ON public.supplier_members
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS job_routing_config_read_all ON public.job_routing_config
    FOR SELECT TO authenticated
    USING (true);

-- Block all writes from PostgREST
DO $$ 
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'maintenance_tickets', 'maintenance_ticket_work_logs', 'maintenance_ticket_signoffs',
        'working_crews', 'crew_members', 'suppliers', 'supplier_members', 'job_routing_config'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_no_write ON public.%I', table_name, table_name);
        EXECUTE format('
            CREATE POLICY %I_no_write ON public.%I
            FOR INSERT, UPDATE, DELETE TO authenticated, anon
            USING (false)
            WITH CHECK (false)
        ', table_name, table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: Catering Tables
-- ============================================
-- Users can read catering data for their building/community
-- Users can read their own orders

CREATE POLICY IF NOT EXISTS catering_services_read_building ON public.catering_services
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email()
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email() AND h.building_id IS NOT NULL
        )
        OR community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS catering_categories_read_service ON public.catering_categories
    FOR SELECT TO authenticated
    USING (
        service_id IN (
            SELECT id FROM public.catering_services cs
            WHERE cs.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = auth.email()
                UNION
                SELECT building_id FROM public.household_members hm
                JOIN public.households h ON hm.household_id = h.id
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = auth.email() AND h.building_id IS NOT NULL
            )
            OR cs.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = auth.email()
            )
        )
    );

CREATE POLICY IF NOT EXISTS catering_category_time_slots_read_category ON public.catering_category_time_slots
    FOR SELECT TO authenticated
    USING (
        category_id IN (
            SELECT id FROM public.catering_categories cc
            WHERE cc.service_id IN (
                SELECT id FROM public.catering_services cs
                WHERE cs.building_id IN (
                    SELECT building_id FROM public.building_members bm
                    JOIN public.users u ON bm.user_id = u.id
                    WHERE u.email = auth.email()
                    UNION
                    SELECT building_id FROM public.household_members hm
                    JOIN public.households h ON hm.household_id = h.id
                    JOIN public.users u ON hm.user_id = u.id
                    WHERE u.email = auth.email() AND h.building_id IS NOT NULL
                )
                OR cs.community_id IN (
                    SELECT community_id FROM public.community_members cm
                    JOIN public.users u ON cm.user_id = u.id
                    WHERE u.email = auth.email()
                )
            )
        )
    );

CREATE POLICY IF NOT EXISTS catering_menu_items_read_service ON public.catering_menu_items
    FOR SELECT TO authenticated
    USING (
        service_id IN (
            SELECT id FROM public.catering_services cs
            WHERE cs.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = auth.email()
                UNION
                SELECT building_id FROM public.household_members hm
                JOIN public.households h ON hm.household_id = h.id
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = auth.email() AND h.building_id IS NOT NULL
            )
            OR cs.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = auth.email()
            )
        )
    );

CREATE POLICY IF NOT EXISTS catering_menu_item_time_slots_read_item ON public.catering_menu_item_time_slots
    FOR SELECT TO authenticated
    USING (
        menu_item_id IN (
            SELECT id FROM public.catering_menu_items cmi
            WHERE cmi.service_id IN (
                SELECT id FROM public.catering_services cs
                WHERE cs.building_id IN (
                    SELECT building_id FROM public.building_members bm
                    JOIN public.users u ON bm.user_id = u.id
                    WHERE u.email = auth.email()
                    UNION
                    SELECT building_id FROM public.household_members hm
                    JOIN public.households h ON hm.household_id = h.id
                    JOIN public.users u ON hm.user_id = u.id
                    WHERE u.email = auth.email() AND h.building_id IS NOT NULL
                )
                OR cs.community_id IN (
                    SELECT community_id FROM public.community_members cm
                    JOIN public.users u ON cm.user_id = u.id
                    WHERE u.email = auth.email()
                )
            )
        )
    );

CREATE POLICY IF NOT EXISTS catering_orders_read_own ON public.catering_orders
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
        OR ordered_by_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
        OR workgroup_id IN (
            SELECT working_group_id FROM public.working_group_members wgm
            JOIN public.users u ON wgm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS catering_order_items_read_order ON public.catering_order_items
    FOR SELECT TO authenticated
    USING (
        order_id IN (
            SELECT id FROM public.catering_orders co
            WHERE co.household_id IN (
                SELECT household_id FROM public.household_members hm
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = auth.email()
            )
            OR co.workgroup_id IN (
                SELECT working_group_id FROM public.working_group_members wgm
                JOIN public.users u ON wgm.user_id = u.id
                WHERE u.email = auth.email()
            )
        )
    );

-- Block all writes from PostgREST
DO $$ 
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'catering_services', 'catering_categories', 'catering_category_time_slots',
        'catering_menu_items', 'catering_menu_item_time_slots',
        'catering_orders', 'catering_order_items'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_no_write ON public.%I', table_name, table_name);
        EXECUTE format('
            CREATE POLICY %I_no_write ON public.%I
            FOR INSERT, UPDATE, DELETE TO authenticated, anon
            USING (false)
            WITH CHECK (false)
        ', table_name, table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: IoT and Automation
-- ============================================
-- Users can read their household's IoT devices

CREATE POLICY IF NOT EXISTS iot_devices_read_household ON public.iot_devices
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

CREATE POLICY IF NOT EXISTS home_assistant_configs_read_household ON public.home_assistant_configs
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

-- Block all writes from PostgREST
DO $$ 
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'iot_devices', 'home_assistant_configs'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_no_write ON public.%I', table_name, table_name);
        EXECUTE format('
            CREATE POLICY %I_no_write ON public.%I
            FOR INSERT, UPDATE, DELETE TO authenticated, anon
            USING (false)
            WITH CHECK (false)
        ', table_name, table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: Announcements
-- ============================================
-- Users can read announcements for their community/building

CREATE POLICY IF NOT EXISTS announcements_read_community ON public.announcements
    FOR SELECT TO authenticated
    USING (
        target_type = 'ALL_HOUSEHOLDS'
        OR (target_type = 'COMMUNITY' AND target_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = auth.email()
        ))
        OR (target_type = 'BUILDING' AND target_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = auth.email()
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email() AND h.building_id IS NOT NULL
        ))
        OR (target_type = 'SPECIFIC_HOUSEHOLD' AND target_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        ))
    );

CREATE POLICY IF NOT EXISTS announcement_reads_read_own ON public.announcement_reads
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = auth.email()
        )
        OR household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = auth.email()
        )
    );

-- Block all writes from PostgREST
DO $$ 
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'announcements', 'announcement_reads'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_no_write ON public.%I', table_name, table_name);
        EXECUTE format('
            CREATE POLICY %I_no_write ON public.%I
            FOR INSERT, UPDATE, DELETE TO authenticated, anon
            USING (false)
            WITH CHECK (false)
        ', table_name, table_name);
    END LOOP;
END $$;

-- ============================================
-- Summary
-- ============================================
-- All tables now have RLS enabled with appropriate policies:
-- 1. Service role (Prisma) can access everything (bypasses RLS)
-- 2. Authenticated users can read data they have access to
-- 3. All writes from PostgREST are blocked (only service role can write)
-- 4. NextAuth and credential tables are completely restricted
--
-- This ensures:
-- - PostgREST API is protected from unauthorized access
-- - Prisma continues to work normally via service role
-- - Users can only see data they're authorized to see
-- - No data can be modified through PostgREST API
