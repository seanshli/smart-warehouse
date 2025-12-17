-- Check for all views with SECURITY DEFINER property
-- Run this in Supabase SQL Editor to find any security concerns

-- Method 1: Check pg_views (may not show SECURITY DEFINER)
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Method 2: Check information_schema.views (more detailed)
SELECT 
    table_schema,
    table_name,
    view_definition,
    is_updatable,
    is_insertable_into,
    is_trigger_updatable
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Method 3: Check pg_class and pg_rewrite for SECURITY DEFINER views
-- This is the most reliable way to find SECURITY DEFINER views
SELECT 
    n.nspname AS schema_name,
    c.relname AS view_name,
    pg_get_userbyid(c.relowner) AS owner,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_rewrite r
            JOIN pg_class rc ON r.ev_class = rc.oid
            WHERE rc.oid = c.oid
            AND r.ev_type = '1' -- SELECT rule
            AND r.ev_enabled = 'O' -- Original
        ) THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END AS security_type
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relkind = 'v' -- Views only
AND n.nspname = 'public'
ORDER BY c.relname;

-- Method 4: Check specifically for maintenance_ticket_summary in all schemas
SELECT 
    n.nspname AS schema_name,
    c.relname AS view_name,
    pg_get_userbyid(c.relowner) AS owner
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relkind = 'v'
AND c.relname LIKE '%maintenance_ticket%'
ORDER BY n.nspname, c.relname;
