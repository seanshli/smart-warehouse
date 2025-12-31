# RLS Security Fix - Supabase Security Warnings

## Overview

This document describes the comprehensive Row Level Security (RLS) migration that fixes all "RLS Disabled in Public" security warnings from Supabase.

## Problem

All public tables in the database were exposed to PostgREST without RLS protection, creating a security vulnerability where unauthorized users could potentially access or modify data through the Supabase API.

## Solution

A comprehensive SQL migration script (`prisma/migrations/enable-rls-on-all-tables.sql`) has been created that:

1. **Enables RLS on all public tables** - Protects all tables from unauthorized PostgREST access
2. **Creates service role bypass policies** - Allows Prisma (which uses service role) to continue working normally
3. **Creates read policies for authenticated users** - Users can read data they have access to
4. **Blocks all writes from PostgREST** - Only service role (Prisma) can write data
5. **Restricts sensitive tables** - NextAuth and credential tables are completely blocked

## How to Apply

### Step 1: Run the Migration in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `prisma/migrations/enable-rls-on-all-tables.sql`
4. Paste into the SQL editor
5. Click **Run** to execute the migration

### Step 2: Verify RLS is Enabled

After running the migration, verify that RLS is enabled:

```sql
-- Check if RLS is enabled on a sample table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'households', 'items')
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

### Step 3: Verify Policies are Created

```sql
-- Check policies for a sample table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY tablename, policyname;
```

You should see policies like:
- `service_role_all_access` - For service role bypass
- `users_read_own` - For authenticated users to read their own data
- `users_no_write` - Blocking writes from PostgREST

## Security Model

### Service Role (Prisma)
- **Full Access**: Service role can read and write all tables
- **Purpose**: Used by Prisma ORM to manage database operations
- **Bypass**: All RLS policies are bypassed for service role

### Authenticated Users (PostgREST API)
- **Read Access**: Users can read data they have access to:
  - Their own user record
  - Household data for households they're members of
  - Community/building data for communities/buildings they're members of
  - Their own orders, tickets, notifications, etc.
- **Write Access**: **BLOCKED** - All writes from PostgREST are blocked
- **Purpose**: Protects data from unauthorized modification via API

### Anonymous Users
- **Access**: **BLOCKED** - No access to any tables
- **Purpose**: Prevents unauthorized access

## Table-Specific Policies

### NextAuth Tables (accounts, sessions, verification_tokens)
- **Access**: Service role only
- **Reason**: These tables contain sensitive authentication data

### User Credentials (user_credentials)
- **Access**: Service role only
- **Reason**: Contains password hashes - must be completely protected

### User Tables (users, User)
- **Read**: Users can read their own user record
- **Write**: Service role only
- **Reason**: User data is sensitive, modifications should go through application logic

### Household Tables (households, rooms, items, etc.)
- **Read**: Household members can read their household's data
- **Write**: Service role only
- **Reason**: Data should only be modified through the application

### Community/Building Tables
- **Read**: Members can read their community/building data
- **Write**: Service role only
- **Reason**: Administrative data should be managed through the application

### Maintenance Tickets
- **Read**: Users can read tickets for their household or assigned to them
- **Write**: Service role only
- **Reason**: Work order data should be managed through the application

### Catering Orders
- **Read**: Users can read their own orders or orders for their workgroup
- **Write**: Service role only
- **Reason**: Order data should be managed through the application

## Important Notes

### Prisma Compatibility
- ✅ **Prisma will continue to work normally** - Service role bypasses all RLS
- ✅ **No code changes required** - Application code doesn't need to be modified
- ✅ **All existing functionality preserved** - RLS only affects PostgREST API access

### PostgREST API Access
- ⚠️ **Direct PostgREST API access is now restricted** - This is intentional for security
- ⚠️ **If your app uses PostgREST directly**, you'll need to use service role key or update to use Prisma
- ✅ **Application API routes (Next.js) continue to work** - They use Prisma with service role

### Testing After Migration
1. **Test application functionality** - Ensure all features still work
2. **Test admin operations** - Verify admin can still manage data
3. **Test user operations** - Verify users can still access their data
4. **Check Supabase security dashboard** - All warnings should be resolved

## Troubleshooting

### Issue: Prisma queries failing
**Solution**: Ensure Prisma is using service role connection string. Check `DATABASE_URL` environment variable includes service role key.

### Issue: Users can't see their data
**Solution**: Check that JWT tokens include user email. The `auth.email()` function reads from JWT claims.

### Issue: Some tables still show warnings
**Solution**: 
1. Verify migration ran successfully
2. Check if table names match exactly (case-sensitive)
3. Re-run the migration for specific tables

### Issue: Need to allow specific PostgREST writes
**Solution**: Modify the migration script to add specific write policies for authenticated users on tables that need it. However, this is **not recommended** for security reasons.

## Verification Queries

### Check RLS Status
```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check Policy Count
```sql
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

### Test User Access (as authenticated user)
```sql
-- This should only return the current user's record
SELECT id, email, name FROM public.users;

-- This should only return households the user is a member of
SELECT id, name FROM public.households;
```

## Security Benefits

1. ✅ **Prevents unauthorized data access** - Users can only see data they're authorized to see
2. ✅ **Prevents data modification via API** - All writes must go through application logic
3. ✅ **Protects sensitive data** - Credentials and authentication data are completely blocked
4. ✅ **Complies with security best practices** - All public tables have RLS enabled
5. ✅ **Maintains application functionality** - Prisma continues to work via service role

## Next Steps

1. **Run the migration** in Supabase SQL Editor
2. **Verify security warnings are resolved** in Supabase dashboard
3. **Test application functionality** to ensure nothing broke
4. **Monitor for any issues** and adjust policies if needed

## Support

If you encounter issues after applying the migration:
1. Check Supabase logs for RLS policy violations
2. Verify Prisma is using service role connection string
3. Check JWT token claims include user email
4. Review specific table policies if access is denied
