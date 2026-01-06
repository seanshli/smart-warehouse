# RLS Migration Column Name Fix

## Issue
The migration keeps failing with column name errors because the database uses **snake_case** (`user_id`, `household_id`) but some references were using camelCase.

## Solution
All `household_members` table references now use:
- Table: `household_members` (lowercase, unquoted)
- Columns: `user_id`, `household_id` (snake_case, unquoted)

## Changes Made
1. Removed duplicate `HouseholdMember` table references (it maps to `household_members`)
2. Changed all `hm."userId"` → `hm.user_id`
3. Changed all `hm."householdId"` → `hm.household_id`
4. Changed all `"HouseholdMember"` → `household_members`

## To Verify Column Names
Run this in Supabase SQL Editor before running the migration:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'household_members' 
ORDER BY ordinal_position;
```

This will show the actual column names in your database.

## Next Steps
1. Run the diagnostic query above to confirm column names
2. If columns are `user_id` and `household_id` (snake_case), the migration should work
3. If columns are `userId` and `householdId` (camelCase), we need to quote them: `hm."userId"`


