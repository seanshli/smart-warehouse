# Critical Fix: Catering Order Issues

## Issues Identified

### 1. ❌ Prisma Error: "Column does not exist"
**Error**: `Invalid \`prisma.cateringOrder.findFirst()\` invocation: The column \`(not available)\` does not exist in the current database.`

**Root Cause**: 
- Added `workgroupId` field to Prisma schema
- Regenerated Prisma client
- Database migration NOT run yet
- Prisma tries to query `workgroupId` column that doesn't exist

**Fix Applied**:
- Temporarily commented out all `workgroupId` usage in queries
- Fixed `findFirst()` to only select `orderNumber` field
- Orders will work without workgroup assignment until migration is run

### 2. ❌ Orders Not Showing (Disappearing)
**Possible Causes**:
- Filtering by building/community might be too restrictive
- Admin check might be failing
- Error in order fetching API

**Fix Applied**:
- Added better error logging in `loadOrders`
- Improved error handling
- Added console logs to debug filtering

### 3. ❌ Lunch Item Cannot Be Added to Cart
**Possible Causes**:
- Time availability check failing
- Item validation failing
- Cart API error

**Need to Check**:
- Menu item `isActive` status
- `quantityAvailable` > 0
- Time slot availability
- Cart API response

## Immediate Actions Required

### Step 1: Run Database Migration (CRITICAL)
**File**: `prisma/migrations/add-workgroup-to-catering-orders.sql`

**In Supabase SQL Editor**:
```sql
-- Add workgroup_id column to catering_orders table
ALTER TABLE catering_orders
ADD COLUMN IF NOT EXISTS workgroup_id TEXT;

-- Add foreign key constraint
ALTER TABLE catering_orders
ADD CONSTRAINT fk_catering_order_workgroup
FOREIGN KEY (workgroup_id) REFERENCES working_groups(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_catering_orders_workgroup_id ON catering_orders(workgroup_id);
```

### Step 2: After Migration, Re-enable Workgroup Code
**Files to update**:
- `app/api/catering/orders/route.ts` - Uncomment workgroupId assignment
- `app/api/catering/orders/[id]/route.ts` - Uncomment workgroup include
- `components/admin/CateringAdminManager.tsx` - Uncomment workgroup display

### Step 3: Test Order Creation
1. Try adding breakfast items to cart - should work
2. Try adding lunch items to cart - check for errors
3. Check browser console for specific error messages
4. Check network tab for failed API calls

### Step 4: Test Order Display
1. Check super admin view - should show all orders
2. Check building admin view - should show only building orders
3. Check community admin view - should show only community orders

## Debugging Steps

### Check Order Fetching
```javascript
// In browser console
fetch('/api/catering/orders?admin=true', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

### Check Cart API
```javascript
// In browser console
fetch('/api/catering/cart', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

### Check Menu Items
```javascript
// In browser console
fetch('/api/catering/menu?buildingId=YOUR_BUILDING_ID', { credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    console.log('Menu items:', data.menuItems)
    console.log('Lunch items:', data.menuItems.filter(i => i.category?.name === '中餐'))
  })
```

## Current Status

✅ **Fixed**: Prisma error (workgroupId temporarily disabled)
⏳ **Pending**: Database migration for workgroupId
❓ **Needs Investigation**: Why lunch items can't be added to cart
❓ **Needs Investigation**: Why orders aren't showing

## Next Steps

1. **URGENT**: Run database migration
2. Test order creation with breakfast items
3. Test order creation with lunch items
4. Compare menu item data between breakfast and lunch
5. Check browser console for specific errors
6. Verify order fetching with different admin levels
