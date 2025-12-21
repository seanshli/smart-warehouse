# Catering Module Fix Instructions

## Issue 1: Order Submission Fails with Constraint Error

**Error:** `"new row for relation "catering_orders" violates check constraint "check_status""`

**Root Cause:** The database has a CHECK constraint that only allows certain status values, but the code is trying to use 'submitted' which isn't in the allowed list.

**Solution:** Run the SQL migration to update the constraint.

### Steps to Fix:

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy and paste the contents of `prisma/migrations/fix-catering-order-status-constraint.sql`
   - Click "Run"

4. **After Migration**
   - The constraint will be updated to allow: 'submitted', 'accepted', 'preparing', 'ready', 'delivered', 'closed', 'cancelled', 'pending', 'confirmed'
   - Update the code to use 'submitted' instead of 'pending' in `app/api/catering/orders/route.ts` line 241

## Issue 2: Edit Functionality for Categories and Menu Items

**Status:** Edit functionality is already implemented and working.

**How to Use:**
1. Go to building/community admin page
2. Click "餐飲服務" (Catering) tab
3. Click "分類管理" (Category Management) or "菜單項目管理" (Menu Item Management)
4. Click the **pencil icon** (✏️) next to any category or menu item
5. The edit modal will open with current values pre-filled
6. Make your changes
7. Click "更新" (Update) button

**If Edit Buttons Don't Appear:**
- Make sure you're logged in as an admin
- Refresh the page
- Check browser console for JavaScript errors
- Verify you're on the admin interface (not user interface)

## Temporary Workaround

Until the migration is run, orders will be created with status 'pending' instead of 'submitted'. This allows orders to be submitted successfully. After running the migration, you can update the code to use 'submitted' status.
