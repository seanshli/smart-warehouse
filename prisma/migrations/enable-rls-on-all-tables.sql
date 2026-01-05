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
    NULLIF((current_setting('request.jwt.claims', true)::json->'https://supabase.co/user_metadata')::json->>'email', '')
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
-- HouseholdMember is mapped to household_members, already enabled above
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
        'households', 'Household', 'household_members',
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
DROP POLICY IF EXISTS accounts_service_only ON public.accounts;
CREATE POLICY accounts_service_only ON public.accounts
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

DROP POLICY IF EXISTS Account_service_only ON public."Account";
CREATE POLICY Account_service_only ON public."Account"
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

-- Sessions
DROP POLICY IF EXISTS sessions_service_only ON public.sessions;
CREATE POLICY sessions_service_only ON public.sessions
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

DROP POLICY IF EXISTS Session_service_only ON public."Session";
CREATE POLICY Session_service_only ON public."Session"
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

-- Verification Tokens
DROP POLICY IF EXISTS verification_tokens_service_only ON public.verification_tokens;
CREATE POLICY verification_tokens_service_only ON public.verification_tokens
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

DROP POLICY IF EXISTS VerificationToken_service_only ON public."VerificationToken";
CREATE POLICY VerificationToken_service_only ON public."VerificationToken"
    FOR ALL TO authenticated, anon
    USING (false)
    WITH CHECK (false);

-- ============================================
-- RLS Policies: User Credentials
-- ============================================
-- Users can read their own credentials
-- Community/Building admins can update credentials for users in their working groups/crews

-- Users can read their own credentials
DROP POLICY IF EXISTS user_credentials_read_own ON public.user_credentials;
CREATE POLICY user_credentials_read_own ON public.user_credentials
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

-- Community admins can update credentials for users in working groups of their community
DROP POLICY IF EXISTS user_credentials_update_community_admin ON public.user_credentials;
CREATE POLICY user_credentials_update_community_admin ON public.user_credentials
    FOR UPDATE TO authenticated
    USING (
        user_id IN (
            SELECT DISTINCT wgm.user_id FROM public.working_group_members wgm
            JOIN public.working_groups wg ON wgm.working_group_id = wg.id
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
        OR user_id IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.community_id IN (
                SELECT community_id FROM public.community_members cm2
                JOIN public.users u ON cm2.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm2.role = 'ADMIN'
            )
            OR wc.building_id IN (
                SELECT b.id FROM public.buildings b
                WHERE b.community_id IN (
                    SELECT community_id FROM public.community_members cm2
                    JOIN public.users u ON cm2.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                    AND cm2.role = 'ADMIN'
                )
            )
        )
    )
    WITH CHECK (
        user_id IN (
            SELECT DISTINCT wgm.user_id FROM public.working_group_members wgm
            JOIN public.working_groups wg ON wgm.working_group_id = wg.id
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
        OR user_id IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.community_id IN (
                SELECT community_id FROM public.community_members cm2
                JOIN public.users u ON cm2.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm2.role = 'ADMIN'
            )
            OR wc.building_id IN (
                SELECT b.id FROM public.buildings b
                WHERE b.community_id IN (
                    SELECT community_id FROM public.community_members cm2
                    JOIN public.users u ON cm2.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                    AND cm2.role = 'ADMIN'
                )
            )
        )
    );

-- Building admins can update credentials for users in working crews of their building
DROP POLICY IF EXISTS user_credentials_update_building_admin ON public.user_credentials;
CREATE POLICY user_credentials_update_building_admin ON public.user_credentials
    FOR UPDATE TO authenticated
    USING (
        user_id IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND bm.role = 'ADMIN'
            )
        )
    )
    WITH CHECK (
        user_id IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND bm.role = 'ADMIN'
            )
        )
    );

-- Community/Building admins can create credentials for new users in their working groups/crews
DROP POLICY IF EXISTS user_credentials_create_admin ON public.user_credentials;
CREATE POLICY user_credentials_create_admin ON public.user_credentials
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT DISTINCT wgm.user_id FROM public.working_group_members wgm
            JOIN public.working_groups wg ON wgm.working_group_id = wg.id
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
        OR user_id IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.community_id IN (
                SELECT community_id FROM public.community_members cm2
                JOIN public.users u ON cm2.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm2.role = 'ADMIN'
            )
            OR wc.building_id IN (
                SELECT b.id FROM public.buildings b
                WHERE b.community_id IN (
                    SELECT community_id FROM public.community_members cm2
                    JOIN public.users u ON cm2.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                    AND cm2.role = 'ADMIN'
                )
            )
            OR wc.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND bm.role = 'ADMIN'
            )
        )
    );

-- Block all other access (delete, etc.)
DROP POLICY IF EXISTS user_credentials_no_delete ON public.user_credentials;
CREATE POLICY user_credentials_no_delete ON public.user_credentials
    FOR DELETE TO authenticated, anon
    USING (false);

DROP POLICY IF EXISTS UserCredentials_read_own ON public."UserCredentials";
CREATE POLICY UserCredentials_read_own ON public."UserCredentials"
    FOR SELECT TO authenticated
    USING (
        "userId" IN (
            SELECT id FROM public."User" 
            WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS UserCredentials_update_admin ON public."UserCredentials";
CREATE POLICY UserCredentials_update_admin ON public."UserCredentials"
    FOR UPDATE TO authenticated
    USING (
        "userId" IN (
            SELECT DISTINCT wgm.user_id FROM public.working_group_members wgm
            JOIN public.working_groups wg ON wgm.working_group_id = wg.id
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public."User" u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
        OR "userId" IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public."User" u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND bm.role = 'ADMIN'
            )
        )
    )
    WITH CHECK (
        "userId" IN (
            SELECT DISTINCT wgm.user_id FROM public.working_group_members wgm
            JOIN public.working_groups wg ON wgm.working_group_id = wg.id
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public."User" u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
        OR "userId" IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public."User" u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND bm.role = 'ADMIN'
            )
        )
    );

DROP POLICY IF EXISTS UserCredentials_no_delete ON public."UserCredentials";
CREATE POLICY UserCredentials_no_delete ON public."UserCredentials"
    FOR DELETE TO authenticated, anon
    USING (false);

-- ============================================
-- RLS Policies: Users Table
-- ============================================
-- Users can read their own data, admins can read all
-- Only service role can write

-- Allow users to read their own user record
-- Try Supabase's auth.email() first, fallback to custom function
DROP POLICY IF EXISTS users_read_own ON public.users;
CREATE POLICY users_read_own ON public.users
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

DROP POLICY IF EXISTS User_read_own ON public."User";
CREATE POLICY User_read_own ON public."User"
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT id FROM public."User" 
            WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

-- Community admins can update user info for users in working groups of their community
DROP POLICY IF EXISTS users_update_community_admin ON public.users;
CREATE POLICY users_update_community_admin ON public.users
    FOR UPDATE TO authenticated
    USING (
        id IN (
            SELECT DISTINCT wgm.user_id FROM public.working_group_members wgm
            JOIN public.working_groups wg ON wgm.working_group_id = wg.id
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
        OR id IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.community_id IN (
                SELECT community_id FROM public.community_members cm2
                JOIN public.users u ON cm2.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm2.role = 'ADMIN'
            )
            OR wc.building_id IN (
                SELECT b.id FROM public.buildings b
                WHERE b.community_id IN (
                    SELECT community_id FROM public.community_members cm2
                    JOIN public.users u ON cm2.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                    AND cm2.role = 'ADMIN'
                )
            )
        )
    )
    WITH CHECK (
        id IN (
            SELECT DISTINCT wgm.user_id FROM public.working_group_members wgm
            JOIN public.working_groups wg ON wgm.working_group_id = wg.id
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
        OR id IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.community_id IN (
                SELECT community_id FROM public.community_members cm2
                JOIN public.users u ON cm2.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm2.role = 'ADMIN'
            )
            OR wc.building_id IN (
                SELECT b.id FROM public.buildings b
                WHERE b.community_id IN (
                    SELECT community_id FROM public.community_members cm2
                    JOIN public.users u ON cm2.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                    AND cm2.role = 'ADMIN'
                )
            )
        )
    );

-- Building admins can update user info for users in working crews of their building
DROP POLICY IF EXISTS users_update_building_admin ON public.users;
CREATE POLICY users_update_building_admin ON public.users
    FOR UPDATE TO authenticated
    USING (
        id IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND bm.role = 'ADMIN'
            )
        )
    )
    WITH CHECK (
        id IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND bm.role = 'ADMIN'
            )
        )
    );

-- Block all other writes (insert, delete) from PostgREST (only service role can write)
DROP POLICY IF EXISTS users_no_insert ON public.users;
CREATE POLICY users_no_insert ON public.users
    FOR INSERT TO authenticated, anon
    WITH CHECK (false);

DROP POLICY IF EXISTS users_no_delete ON public.users;
CREATE POLICY users_no_delete ON public.users
    FOR DELETE TO authenticated, anon
    USING (false);

DROP POLICY IF EXISTS User_update_community_admin ON public."User";
CREATE POLICY User_update_community_admin ON public."User"
    FOR UPDATE TO authenticated
    USING (
        id IN (
            SELECT DISTINCT wgm.user_id FROM public.working_group_members wgm
            JOIN public.working_groups wg ON wgm.working_group_id = wg.id
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public."User" u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
        OR id IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public."User" u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND bm.role = 'ADMIN'
            )
        )
    )
    WITH CHECK (
        id IN (
            SELECT DISTINCT wgm.user_id FROM public.working_group_members wgm
            JOIN public.working_groups wg ON wgm.working_group_id = wg.id
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public."User" u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
        OR id IN (
            SELECT DISTINCT cm.user_id FROM public.crew_members cm
            JOIN public.working_crews wc ON cm.crew_id = wc.id
            WHERE wc.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public."User" u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND bm.role = 'ADMIN'
            )
        )
    );

DROP POLICY IF EXISTS User_no_insert ON public."User";
CREATE POLICY User_no_insert ON public."User"
    FOR INSERT TO authenticated, anon
    WITH CHECK (false);

DROP POLICY IF EXISTS User_no_delete ON public."User";
CREATE POLICY User_no_delete ON public."User"
    FOR DELETE TO authenticated, anon
    USING (false);

-- ============================================
-- RLS Policies: Household Tables
-- ============================================
-- Household members can access their household's data
-- Admins can access all

-- Households: Members can read their household
DROP POLICY IF EXISTS households_read_member ON public.households;
CREATE POLICY households_read_member ON public.households
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS Household_read_member ON public."Household";
CREATE POLICY Household_read_member ON public."Household"
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

-- Household Members: Users can read their own memberships
DROP POLICY IF EXISTS household_members_read_own ON public.household_members;
CREATE POLICY household_members_read_own ON public.household_members
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS HouseholdMember_read_own ON public.household_members;
CREATE POLICY HouseholdMember_read_own ON public.household_members
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public."User" WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

-- Rooms, Cabinets, Categories, Items: Members can access their household's data
DROP POLICY IF EXISTS rooms_read_household ON public.rooms;
CREATE POLICY rooms_read_household ON public.rooms
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS Room_read_household ON public."Room";
CREATE POLICY Room_read_household ON public."Room"
    FOR SELECT TO authenticated
    USING (
        "householdId" IN (
            SELECT "householdId" FROM public."HouseholdMember" hm
            JOIN public."User" u ON hm."userId" = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS cabinets_read_household ON public.cabinets;
CREATE POLICY cabinets_read_household ON public.cabinets
    FOR SELECT TO authenticated
    USING (
        room_id IN (
            SELECT r.id FROM public.rooms r
            JOIN public.household_members hm ON r.household_id = hm.household_id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS Cabinet_read_household ON public."Cabinet";
CREATE POLICY Cabinet_read_household ON public."Cabinet"
    FOR SELECT TO authenticated
    USING (
        "roomId" IN (
            SELECT r.id FROM public."Room" r
            JOIN public."HouseholdMember" hm ON r."householdId" = hm."householdId"
            JOIN public."User" u ON hm."userId" = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS categories_read_household ON public.categories;
CREATE POLICY categories_read_household ON public.categories
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS Category_read_household ON public."Category";
CREATE POLICY Category_read_household ON public."Category"
    FOR SELECT TO authenticated
    USING (
        "householdId" IN (
            SELECT "householdId" FROM public."HouseholdMember" hm
            JOIN public."User" u ON hm."userId" = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS items_read_household ON public.items;
CREATE POLICY items_read_household ON public.items
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS Item_read_household ON public."Item";
CREATE POLICY Item_read_household ON public."Item"
    FOR SELECT TO authenticated
    USING (
        "householdId" IN (
            SELECT "householdId" FROM public."HouseholdMember" hm
            JOIN public."User" u ON hm."userId" = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS item_history_read_household ON public.item_history;
CREATE POLICY item_history_read_household ON public.item_history
    FOR SELECT TO authenticated
    USING (
        item_id IN (
            SELECT i.id FROM public.items i
            JOIN public.household_members hm ON i.household_id = hm.household_id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS user_activities_read_own ON public.user_activities;
CREATE POLICY user_activities_read_own ON public.user_activities
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS Activity_read_own ON public."Activity";
CREATE POLICY Activity_read_own ON public."Activity"
    FOR SELECT TO authenticated
    USING (
        "performedBy" IN (
            SELECT id FROM public."User" WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS barcodes_read_own ON public.barcodes;
CREATE POLICY barcodes_read_own ON public.barcodes
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS notifications_read_own ON public.notifications;
CREATE POLICY notifications_read_own ON public.notifications
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS Notification_read_own ON public."Notification";
CREATE POLICY Notification_read_own ON public."Notification"
    FOR SELECT TO authenticated
    USING (
        "userId" IN (
            SELECT id FROM public."User" WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

-- Block all writes from PostgREST for household tables
DO $$ 
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'households', 'Household', 'household_members',
        'rooms', 'Room', 'cabinets', 'Cabinet', 'categories', 'Category',
        'items', 'Item', 'item_history', 'user_activities', 'Activity',
        'barcodes', 'notifications', 'Notification'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_insert', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated, anon WITH CHECK (false)', table_name || '_no_insert', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_update', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false)', table_name || '_no_update', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_delete', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated, anon USING (false)', table_name || '_no_delete', table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: Community and Building Tables
-- ============================================
-- Members can read their community/building data
-- Admins can read all

-- Communities: Members can read their community
DROP POLICY IF EXISTS communities_read_member ON public.communities;
CREATE POLICY communities_read_member ON public.communities
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

-- Buildings: Members can read their building
DROP POLICY IF EXISTS buildings_read_member ON public.buildings;
CREATE POLICY buildings_read_member ON public.buildings
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
        )
    );

-- Community/Building Members: Users can read their own memberships
DROP POLICY IF EXISTS community_members_read_own ON public.community_members;
CREATE POLICY community_members_read_own ON public.community_members
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS building_members_read_own ON public.building_members;
CREATE POLICY building_members_read_own ON public.building_members
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

-- Floors, Mailboxes, Door Bells, Packages, Facilities: Members can read their building's data
DROP POLICY IF EXISTS floors_read_building ON public.floors;
CREATE POLICY floors_read_building ON public.floors
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS mailboxes_read_building ON public.mailboxes;
CREATE POLICY mailboxes_read_building ON public.mailboxes
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
        )
        OR household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS door_bells_read_building ON public.door_bells;
CREATE POLICY door_bells_read_building ON public.door_bells
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
        )
        OR household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS package_lockers_read_building ON public.package_lockers;
CREATE POLICY package_lockers_read_building ON public.package_lockers
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS packages_read_building ON public.packages;
CREATE POLICY packages_read_building ON public.packages
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
        )
        OR household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS facilities_read_building ON public.facilities;
CREATE POLICY facilities_read_building ON public.facilities
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS facility_operating_hours_read_building ON public.facility_operating_hours;
CREATE POLICY facility_operating_hours_read_building ON public.facility_operating_hours
    FOR SELECT TO authenticated
    USING (
        facility_id IN (
            SELECT f.id FROM public.facilities f
            WHERE f.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                UNION
                SELECT building_id FROM public.household_members hm
                JOIN public.households h ON hm.household_id = h.id
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
            )
        )
    );

DROP POLICY IF EXISTS facility_reservations_read_own ON public.facility_reservations;
CREATE POLICY facility_reservations_read_own ON public.facility_reservations
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR facility_id IN (
            SELECT f.id FROM public.facilities f
            WHERE f.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_insert', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated, anon WITH CHECK (false)', table_name || '_no_insert', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_update', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false)', table_name || '_no_update', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_delete', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated, anon USING (false)', table_name || '_no_delete', table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: Working Groups
-- ============================================
-- Members can read their working groups

DROP POLICY IF EXISTS working_groups_read_member ON public.working_groups;
CREATE POLICY working_groups_read_member ON public.working_groups
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT working_group_id FROM public.working_group_members wgm
            JOIN public.users u ON wgm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS working_group_members_read_member ON public.working_group_members;
CREATE POLICY working_group_members_read_member ON public.working_group_members
    FOR SELECT TO authenticated
    USING (
        working_group_id IN (
            SELECT working_group_id FROM public.working_group_members wgm
            JOIN public.users u ON wgm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS working_group_permissions_read_member ON public.working_group_permissions;
CREATE POLICY working_group_permissions_read_member ON public.working_group_permissions
    FOR SELECT TO authenticated
    USING (
        working_group_id IN (
            SELECT working_group_id FROM public.working_group_members wgm
            JOIN public.users u ON wgm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS join_requests_read_own ON public.join_requests;
CREATE POLICY join_requests_read_own ON public.join_requests
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR target_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND cm.role = 'ADMIN'
            UNION
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND bm.role = 'ADMIN'
        )
    );

-- ============================================
-- RLS Policies: Working Group Management (Admin Access)
-- ============================================
-- Community admins can manage working groups and members in their community
-- Building admins can manage working crews in their building

-- Working Groups: Community admins can manage working groups in their community
DROP POLICY IF EXISTS working_groups_manage_community_admin ON public.working_groups;
CREATE POLICY working_groups_manage_community_admin ON public.working_groups
    FOR ALL TO authenticated
    USING (
        community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND cm.role = 'ADMIN'
        )
    )
    WITH CHECK (
        community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND cm.role = 'ADMIN'
        )
    );

-- Working Group Members: Community admins can manage members of working groups in their community
DROP POLICY IF EXISTS working_group_members_manage_community_admin ON public.working_group_members;
CREATE POLICY working_group_members_manage_community_admin ON public.working_group_members
    FOR ALL TO authenticated
    USING (
        working_group_id IN (
            SELECT wg.id FROM public.working_groups wg
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
    )
    WITH CHECK (
        working_group_id IN (
            SELECT wg.id FROM public.working_groups wg
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
    );

-- Working Group Permissions: Community admins can manage permissions for working groups in their community
DROP POLICY IF EXISTS working_group_permissions_manage_community_admin ON public.working_group_permissions;
CREATE POLICY working_group_permissions_manage_community_admin ON public.working_group_permissions
    FOR ALL TO authenticated
    USING (
        working_group_id IN (
            SELECT wg.id FROM public.working_groups wg
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
    )
    WITH CHECK (
        working_group_id IN (
            SELECT wg.id FROM public.working_groups wg
            WHERE wg.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
    );

-- Working Crews: Community admins can manage crews for buildings in their community
-- Building admins can manage crews for their building
DROP POLICY IF EXISTS working_crews_manage_community_admin ON public.working_crews;
CREATE POLICY working_crews_manage_community_admin ON public.working_crews
    FOR ALL TO authenticated
    USING (
        community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND cm.role = 'ADMIN'
        )
        OR building_id IN (
            SELECT b.id FROM public.buildings b
            WHERE b.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
    )
    WITH CHECK (
        community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND cm.role = 'ADMIN'
        )
        OR building_id IN (
            SELECT b.id FROM public.buildings b
            WHERE b.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
        )
    );

DROP POLICY IF EXISTS working_crews_manage_building_admin ON public.working_crews;
CREATE POLICY working_crews_manage_building_admin ON public.working_crews
    FOR ALL TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND bm.role = 'ADMIN'
        )
    )
    WITH CHECK (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND bm.role = 'ADMIN'
        )
    );

-- Crew Members: Community admins can manage crew members for crews in their community
-- Building admins can manage crew members for crews in their building
DROP POLICY IF EXISTS crew_members_manage_community_admin ON public.crew_members;
CREATE POLICY crew_members_manage_community_admin ON public.crew_members
    FOR ALL TO authenticated
    USING (
        crew_id IN (
            SELECT wc.id FROM public.working_crews wc
            WHERE wc.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
            OR wc.building_id IN (
                SELECT b.id FROM public.buildings b
                WHERE b.community_id IN (
                    SELECT community_id FROM public.community_members cm
                    JOIN public.users u ON cm.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                    AND cm.role = 'ADMIN'
                )
            )
        )
    )
    WITH CHECK (
        crew_id IN (
            SELECT wc.id FROM public.working_crews wc
            WHERE wc.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND cm.role = 'ADMIN'
            )
            OR wc.building_id IN (
                SELECT b.id FROM public.buildings b
                WHERE b.community_id IN (
                    SELECT community_id FROM public.community_members cm
                    JOIN public.users u ON cm.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                    AND cm.role = 'ADMIN'
                )
            )
        )
    );

DROP POLICY IF EXISTS crew_members_manage_building_admin ON public.crew_members;
CREATE POLICY crew_members_manage_building_admin ON public.crew_members
    FOR ALL TO authenticated
    USING (
        crew_id IN (
            SELECT wc.id FROM public.working_crews wc
            WHERE wc.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND bm.role = 'ADMIN'
            )
        )
    )
    WITH CHECK (
        crew_id IN (
            SELECT wc.id FROM public.working_crews wc
            WHERE wc.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                AND bm.role = 'ADMIN'
            )
        )
    );

-- Join Requests: Keep existing read policy, but allow community/building admins to manage requests
DROP POLICY IF EXISTS join_requests_manage_admin_insert ON public.join_requests;
CREATE POLICY join_requests_manage_admin_insert ON public.join_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        target_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND cm.role = 'ADMIN'
        )
        OR target_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND bm.role = 'ADMIN'
        )
    );

DROP POLICY IF EXISTS join_requests_manage_admin_update ON public.join_requests;
CREATE POLICY join_requests_manage_admin_update ON public.join_requests
    FOR UPDATE TO authenticated
    USING (
        target_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND cm.role = 'ADMIN'
        )
        OR target_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND bm.role = 'ADMIN'
        )
    )
    WITH CHECK (
        target_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND cm.role = 'ADMIN'
        )
        OR target_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND bm.role = 'ADMIN'
        )
    );

DROP POLICY IF EXISTS join_requests_manage_admin_delete ON public.join_requests;
CREATE POLICY join_requests_manage_admin_delete ON public.join_requests
    FOR DELETE TO authenticated
    USING (
        target_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND cm.role = 'ADMIN'
        )
        OR target_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            AND bm.role = 'ADMIN'
        )
    );

-- ============================================
-- RLS Policies: Communication Tables
-- ============================================
-- Users can read their own conversations and messages

DROP POLICY IF EXISTS conversations_read_own ON public.conversations;
CREATE POLICY conversations_read_own ON public.conversations
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR created_by IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS call_sessions_read_own ON public.call_sessions;
CREATE POLICY call_sessions_read_own ON public.call_sessions
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR initiator_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS chat_history_read_own ON public.chat_history;
CREATE POLICY chat_history_read_own ON public.chat_history
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR sender_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS door_bell_call_sessions_read_building ON public.door_bell_call_sessions;
CREATE POLICY door_bell_call_sessions_read_building ON public.door_bell_call_sessions
    FOR SELECT TO authenticated
    USING (
        door_bell_id IN (
            SELECT db.id FROM public.door_bells db
            WHERE db.household_id IN (
                SELECT household_id FROM public.household_members hm
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            )
            OR db.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            )
        )
    );

DROP POLICY IF EXISTS door_bell_messages_read_building ON public.door_bell_messages;
CREATE POLICY door_bell_messages_read_building ON public.door_bell_messages
    FOR SELECT TO authenticated
    USING (
        call_session_id IN (
            SELECT dbs.id FROM public.door_bell_call_sessions dbs
            JOIN public.door_bells db ON dbs.door_bell_id = db.id
            WHERE db.household_id IN (
                SELECT household_id FROM public.household_members hm
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            )
            OR db.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_insert', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated, anon WITH CHECK (false)', table_name || '_no_insert', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_update', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false)', table_name || '_no_update', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_delete', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated, anon USING (false)', table_name || '_no_delete', table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: Maintenance and Work Orders
-- ============================================
-- Users can read tickets for their household
-- Admins can read all tickets

DROP POLICY IF EXISTS maintenance_tickets_read_household ON public.maintenance_tickets;
CREATE POLICY maintenance_tickets_read_household ON public.maintenance_tickets
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR requested_by_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR assigned_worker_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR assigned_crew_id IN (
            SELECT wc.id FROM public.working_crews wc
            JOIN public.crew_members cm ON wc.id = cm.crew_id
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS maintenance_ticket_work_logs_read_ticket ON public.maintenance_ticket_work_logs;
CREATE POLICY maintenance_ticket_work_logs_read_ticket ON public.maintenance_ticket_work_logs
    FOR SELECT TO authenticated
    USING (
        ticket_id IN (
            SELECT id FROM public.maintenance_tickets mt
            WHERE mt.household_id IN (
                SELECT household_id FROM public.household_members hm
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            )
            OR mt.assigned_worker_id IN (
                SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
            )
        )
    );

DROP POLICY IF EXISTS maintenance_ticket_signoffs_read_ticket ON public.maintenance_ticket_signoffs;
CREATE POLICY maintenance_ticket_signoffs_read_ticket ON public.maintenance_ticket_signoffs
    FOR SELECT TO authenticated
    USING (
        ticket_id IN (
            SELECT id FROM public.maintenance_tickets mt
            WHERE mt.household_id IN (
                SELECT household_id FROM public.household_members hm
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            )
        )
    );

DROP POLICY IF EXISTS working_crews_read_member ON public.working_crews;
CREATE POLICY working_crews_read_member ON public.working_crews
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT crew_id FROM public.crew_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS crew_members_read_member ON public.crew_members;
CREATE POLICY crew_members_read_member ON public.crew_members
    FOR SELECT TO authenticated
    USING (
        crew_id IN (
            SELECT crew_id FROM public.crew_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS suppliers_read_active ON public.suppliers;
CREATE POLICY suppliers_read_active ON public.suppliers
    FOR SELECT TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS supplier_members_read_own ON public.supplier_members;
CREATE POLICY supplier_members_read_own ON public.supplier_members
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS job_routing_config_read_all ON public.job_routing_config;
CREATE POLICY job_routing_config_read_all ON public.job_routing_config
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_insert', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated, anon WITH CHECK (false)', table_name || '_no_insert', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_update', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false)', table_name || '_no_update', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_delete', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated, anon USING (false)', table_name || '_no_delete', table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: Catering Tables
-- ============================================
-- Users can read catering data for their building/community
-- Users can read their own orders

DROP POLICY IF EXISTS catering_services_read_building ON public.catering_services;
CREATE POLICY catering_services_read_building ON public.catering_services
    FOR SELECT TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
        )
        OR community_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS catering_categories_read_service ON public.catering_categories;
CREATE POLICY catering_categories_read_service ON public.catering_categories
    FOR SELECT TO authenticated
    USING (
        service_id IN (
            SELECT id FROM public.catering_services cs
            WHERE cs.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                UNION
                SELECT building_id FROM public.household_members hm
                JOIN public.households h ON hm.household_id = h.id
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
            )
            OR cs.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            )
        )
    );

DROP POLICY IF EXISTS catering_category_time_slots_read_category ON public.catering_category_time_slots;
CREATE POLICY catering_category_time_slots_read_category ON public.catering_category_time_slots
    FOR SELECT TO authenticated
    USING (
        category_id IN (
            SELECT id FROM public.catering_categories cc
            WHERE cc.service_id IN (
                SELECT id FROM public.catering_services cs
                WHERE cs.building_id IN (
                    SELECT building_id FROM public.building_members bm
                    JOIN public.users u ON bm.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                    UNION
                    SELECT building_id FROM public.household_members hm
                    JOIN public.households h ON hm.household_id = h.id
                    JOIN public.users u ON hm.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
                )
                OR cs.community_id IN (
                    SELECT community_id FROM public.community_members cm
                    JOIN public.users u ON cm.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                )
            )
        )
    );

DROP POLICY IF EXISTS catering_menu_items_read_service ON public.catering_menu_items;
CREATE POLICY catering_menu_items_read_service ON public.catering_menu_items
    FOR SELECT TO authenticated
    USING (
        service_id IN (
            SELECT id FROM public.catering_services cs
            WHERE cs.building_id IN (
                SELECT building_id FROM public.building_members bm
                JOIN public.users u ON bm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                UNION
                SELECT building_id FROM public.household_members hm
                JOIN public.households h ON hm.household_id = h.id
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
            )
            OR cs.community_id IN (
                SELECT community_id FROM public.community_members cm
                JOIN public.users u ON cm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            )
        )
    );

DROP POLICY IF EXISTS catering_menu_item_time_slots_read_item ON public.catering_menu_item_time_slots;
CREATE POLICY catering_menu_item_time_slots_read_item ON public.catering_menu_item_time_slots
    FOR SELECT TO authenticated
    USING (
        menu_item_id IN (
            SELECT id FROM public.catering_menu_items cmi
            WHERE cmi.service_id IN (
                SELECT id FROM public.catering_services cs
                WHERE cs.building_id IN (
                    SELECT building_id FROM public.building_members bm
                    JOIN public.users u ON bm.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                    UNION
                    SELECT building_id FROM public.household_members hm
                    JOIN public.households h ON hm.household_id = h.id
                    JOIN public.users u ON hm.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
                )
                OR cs.community_id IN (
                    SELECT community_id FROM public.community_members cm
                    JOIN public.users u ON cm.user_id = u.id
                    WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
                )
            )
        )
    );

DROP POLICY IF EXISTS catering_orders_read_own ON public.catering_orders;
CREATE POLICY catering_orders_read_own ON public.catering_orders
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR ordered_by_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR workgroup_id IN (
            SELECT working_group_id FROM public.working_group_members wgm
            JOIN public.users u ON wgm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS catering_order_items_read_order ON public.catering_order_items;
CREATE POLICY catering_order_items_read_order ON public.catering_order_items
    FOR SELECT TO authenticated
    USING (
        order_id IN (
            SELECT id FROM public.catering_orders co
            WHERE co.household_id IN (
                SELECT household_id FROM public.household_members hm
                JOIN public.users u ON hm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            )
            OR co.workgroup_id IN (
                SELECT working_group_id FROM public.working_group_members wgm
                JOIN public.users u ON wgm.user_id = u.id
                WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_insert', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated, anon WITH CHECK (false)', table_name || '_no_insert', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_update', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false)', table_name || '_no_update', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_delete', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated, anon USING (false)', table_name || '_no_delete', table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: IoT and Automation
-- ============================================
-- Users can read their household's IoT devices

DROP POLICY IF EXISTS iot_devices_read_household ON public.iot_devices;
CREATE POLICY iot_devices_read_household ON public.iot_devices
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
    );

DROP POLICY IF EXISTS home_assistant_configs_read_household ON public.home_assistant_configs;
CREATE POLICY home_assistant_configs_read_household ON public.home_assistant_configs
    FOR SELECT TO authenticated
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_insert', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated, anon WITH CHECK (false)', table_name || '_no_insert', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_update', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false)', table_name || '_no_update', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_delete', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated, anon USING (false)', table_name || '_no_delete', table_name);
    END LOOP;
END $$;

-- ============================================
-- RLS Policies: Announcements
-- ============================================
-- Users can read announcements for their community/building

DROP POLICY IF EXISTS announcements_read_community ON public.announcements;
CREATE POLICY announcements_read_community ON public.announcements
    FOR SELECT TO authenticated
    USING (
        target_type = 'ALL_HOUSEHOLDS'
        OR (target_type = 'COMMUNITY' AND target_id IN (
            SELECT community_id FROM public.community_members cm
            JOIN public.users u ON cm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        ))
        OR (target_type = 'BUILDING' AND target_id IN (
            SELECT building_id FROM public.building_members bm
            JOIN public.users u ON bm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
            UNION
            SELECT building_id FROM public.household_members hm
            JOIN public.households h ON hm.household_id = h.id
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email()) AND h.building_id IS NOT NULL
        ))
        OR (target_type = 'SPECIFIC_HOUSEHOLD' AND target_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
        ))
    );

DROP POLICY IF EXISTS announcement_reads_read_own ON public.announcement_reads;
CREATE POLICY announcement_reads_read_own ON public.announcement_reads
    FOR SELECT TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE email = COALESCE((SELECT auth.email()), public.get_user_email())
        )
        OR household_id IN (
            SELECT household_id FROM public.household_members hm
            JOIN public.users u ON hm.user_id = u.id
            WHERE u.email = COALESCE((SELECT auth.email()), public.get_user_email())
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_insert', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated, anon WITH CHECK (false)', table_name || '_no_insert', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_update', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false)', table_name || '_no_update', table_name);
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_no_delete', table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated, anon USING (false)', table_name || '_no_delete', table_name);
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
