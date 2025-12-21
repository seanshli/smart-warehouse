# Supabase Migration Instructions for Catering Module

## ⚠️ IMPORTANT: Manual Migration Required

You need to run the SQL migration file in Supabase manually. Here's how:

## Steps to Run Migration

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project: `ddvjegjzxjaetpaptjlo`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Open the file: `prisma/migrations/add-catering-module.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify Migration**
   - Go to "Table Editor" in the left sidebar
   - You should see these new tables:
     - `catering_services`
     - `catering_categories`
     - `catering_menu_items`
     - `catering_menu_item_time_slots`
     - `catering_orders`
     - `catering_order_items`
   - Check that `notifications` table has the new `catering_order_id` column

## What the Migration Does

1. **Creates 6 new tables** for the catering system
2. **Adds `catering_order_id` column** to the `notifications` table
3. **Creates indexes** for better query performance
4. **Creates functions** for order number generation
5. **Creates triggers** for auto-updating timestamps

## After Migration

Once the migration is complete, you can:

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Verify Schema**:
   ```bash
   npx prisma db pull
   ```

3. **Start Using the API**:
   - The API routes are ready to use
   - Frontend components can be built next

## Troubleshooting

If you encounter any errors:

1. **Check for existing tables**: The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times
2. **Check constraints**: Make sure `buildings` and `communities` tables exist
3. **Check permissions**: Make sure you have admin access to the Supabase project

## Next Steps

After running the migration:
- ✅ Database schema is ready
- ✅ API routes are ready
- ⏳ Frontend components need to be created
- ⏳ Navigation links need to be added

---

**Migration File Location**: `prisma/migrations/add-catering-module.sql`
