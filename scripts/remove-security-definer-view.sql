-- Remove SECURITY DEFINER view if it exists
-- Run this in Supabase SQL Editor to safely remove the view

-- First, check if the view exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relkind = 'v'
        AND n.nspname = 'public'
        AND c.relname = 'maintenance_ticket_summary'
    ) THEN
        DROP VIEW IF EXISTS public.maintenance_ticket_summary CASCADE;
        RAISE NOTICE 'View maintenance_ticket_summary has been dropped';
    ELSE
        RAISE NOTICE 'View maintenance_ticket_summary does not exist';
    END IF;
END $$;

-- Verify it's gone
SELECT 
    schemaname,
    viewname
FROM pg_views 
WHERE viewname = 'maintenance_ticket_summary';
