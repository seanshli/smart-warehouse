# How to Verify Column Names in Supabase

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project: `ddvjegjzxjaetpaptjlo`

### 2. Open SQL Editor
- Click **"SQL Editor"** in the left sidebar
- Click **"New Query"** button

### 3. Run Diagnostic Query

Copy and paste this query into the SQL Editor:

```sql
-- Check household_members table columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'household_members'
ORDER BY ordinal_position;
```

Click **"Run"** (or press Cmd/Ctrl + Enter)

### 4. Check Results

Look at the `column_name` column in the results. You should see either:

**Option A: Snake_case (what we're using now)**
```
column_name
-----------
id
user_id          ← snake_case
household_id     ← snake_case
role
joined_at
```

**Option B: CamelCase (needs quotes)**
```
column_name
-----------
id
userId           ← camelCase (needs quotes: "userId")
householdId      ← camelCase (needs quotes: "householdId")
role
joinedAt
```

### 5. Check for Duplicate Tables

Also run this to see if there are two tables:

```sql
-- Check if both household_members and HouseholdMember exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%household%member%' OR table_name LIKE '%Household%Member%')
ORDER BY table_name;
```

### 6. Report Back

Tell me what you see:
- Are the columns `user_id`/`household_id` (snake_case) or `userId`/`householdId` (camelCase)?
- Are there one or two tables?

Then I can fix the SQL file accordingly!


