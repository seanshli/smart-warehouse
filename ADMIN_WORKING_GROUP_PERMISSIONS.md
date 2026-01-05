# Admin Working Group Permissions

## Summary

RLS policies have been updated to allow community and building admins to manage their working group members, including:
- Adding/removing working group members
- Updating member roles
- Updating user passwords
- Managing working crews (building teams)

## Changes Made

### 1. Working Group Management
- **Community Admins** can now INSERT, UPDATE, DELETE:
  - `working_groups` in their community
  - `working_group_members` for working groups in their community
  - `working_group_permissions` for working groups in their community

### 2. Working Crew Management
- **Community Admins** can manage `working_crews` for buildings in their community
- **Building Admins** can manage `working_crews` for their building
- Both can manage `crew_members` for crews they have access to

### 3. User Credentials Management
- **Community Admins** can UPDATE `user_credentials` (passwords) for users in:
  - Working groups in their community
  - Working crews for buildings in their community
- **Building Admins** can UPDATE `user_credentials` for users in:
  - Working crews in their building

### 4. User Information Management
- **Community Admins** can UPDATE `users` table (including roles) for users in their working groups/crews
- **Building Admins** can UPDATE `users` table for users in their working crews

## Migration File

The updated RLS policies are in: `prisma/migrations/enable-rls-on-all-tables.sql`

## How to Apply

### Option 1: Run via Script (Recommended)
```bash
npx tsx scripts/run-rls-migration.ts
```

### Option 2: Manual Execution in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Open `prisma/migrations/enable-rls-on-all-tables.sql`
3. Copy and paste the entire file
4. Click "Run"

**Note**: If you encounter syntax errors when running the entire file, you may need to run it in sections or use Supabase SQL Editor directly.

## Verification

After applying the migration, verify the policies exist:

```sql
-- Check working group member policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('working_group_members', 'working_groups', 'crew_members', 'working_crews', 'user_credentials')
ORDER BY tablename, policyname;
```

## Permissions Summary

| Admin Type | Can Manage | Tables |
|------------|------------|--------|
| Community Admin | Working groups in their community | `working_groups`, `working_group_members`, `working_group_permissions` |
| Community Admin | Working crews for buildings in their community | `working_crews`, `crew_members` |
| Community Admin | User passwords for their working groups/crews | `user_credentials` |
| Community Admin | User info for their working groups/crews | `users` |
| Building Admin | Working crews in their building | `working_crews`, `crew_members` |
| Building Admin | User passwords for their working crews | `user_credentials` |
| Building Admin | User info for their working crews | `users` |


