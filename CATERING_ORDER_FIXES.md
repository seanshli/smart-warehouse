# Catering Order Fixes Summary

## Issues Fixed

### 1. ✅ Fixed Error When Clicking Order
**Problem**: Error occurred when clicking on an order to view details.

**Solution**:
- Added `credentials: 'include'` to all order API calls
- Improved error handling with proper try-catch blocks
- Fixed Next.js 15 async params handling
- Added proper loading states and error messages
- Better error messages for debugging

**Files Changed**:
- `app/catering/orders/[id]/page.tsx`
- `app/api/catering/orders/[id]/route.ts`

### 2. ✅ Orders Filtered by Building/Community
**Problem**: Orders were showing at super admin level, not filtered by building/community where order was issued.

**Solution**:
- Updated `GET /api/catering/orders` to filter by `buildingId` or `communityId`
- Updated `GET /api/catering/orders/[id]` to check building/community admin permissions
- Building/community admins can only access orders from their building/community
- Super admins can access all orders
- Added building and community info to order responses

**Files Changed**:
- `app/api/catering/orders/route.ts`
- `app/api/catering/orders/[id]/route.ts`
- `components/admin/CateringAdminManager.tsx` (added orders tab)

### 3. ✅ Orders Channeled Through Workgroup
**Problem**: Orders need to be channeled through workgroups.

**Solution**:
- Added `workgroupId` field to `CateringOrder` schema
- Orders are automatically assigned to appropriate workgroup when created:
  - First tries to find workgroup with type CATERING/FOOD_SERVICE/KITCHEN
  - Falls back to any workgroup in the community
- Workgroup members can filter orders by their workgroup
- Orders display workgroup information in detail view and admin list

**Files Changed**:
- `prisma/schema.prisma` - Added workgroupId field and relation
- `app/api/catering/orders/route.ts` - Auto-assign workgroup on order creation
- `app/api/catering/orders/[id]/route.ts` - Include workgroup in response
- `app/catering/orders/[id]/page.tsx` - Display workgroup info
- `components/admin/CateringAdminManager.tsx` - Show workgroup in orders list
- `prisma/migrations/add-workgroup-to-catering-orders.sql` - Database migration

## Database Migration Required

**IMPORTANT**: You need to run the SQL migration in Supabase SQL Editor:

1. Open Supabase Dashboard → SQL Editor
2. Run the file: `prisma/migrations/add-workgroup-to-catering-orders.sql`

This will:
- Add `workgroup_id` column to `catering_orders` table
- Add foreign key constraint to `working_groups` table
- Add index for faster queries

## New Features

### Orders Tab in Admin Manager
- New "訂單管理" (Order Management) tab in `CateringAdminManager`
- Shows orders filtered by building/community
- Clickable orders that open in new tab
- Displays: order number, household, building, status, items count, total, and workgroup

### Workgroup Assignment Logic
When an order is created:
1. System finds the household's building and community
2. Looks for workgroup with type: CATERING, FOOD_SERVICE, KITCHEN, or ADMINISTRATION
3. If not found, uses any workgroup in the community
4. Assigns order to that workgroup

### Workgroup Filtering
- Workgroup members can see orders assigned to their workgroup
- Building/community admins see all orders for their building/community
- Super admins see all orders

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Test order creation - verify workgroup is assigned
- [ ] Test clicking order - should open detail page without error
- [ ] Test building admin - should only see orders from their building
- [ ] Test community admin - should only see orders from their community
- [ ] Test workgroup member - should see orders assigned to their workgroup
- [ ] Test orders tab in admin manager - should show filtered orders
- [ ] Verify workgroup info displays in order detail page
