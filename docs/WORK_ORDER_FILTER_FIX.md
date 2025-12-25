# Work Order Filter Fix Summary

## Issues Fixed

### 1. Filter Not Working
**Problem**: Filters in both 工單中心 (Dashboard) and 工單 (TicketList) were not filtering work orders when selected.

**Root Cause**: 
- Filter was sending normalized status values (`pending`, `in_progress`, etc.) to the API
- API expects raw status values (`PENDING_EVALUATION`, `submitted`, etc.)
- Filtering was happening at API level instead of client-side

**Solution**:
- Removed status filtering from API calls
- All filtering now happens client-side using normalized statuses
- Filter values (`pending`, `in_progress`, `completed`, `cancelled`) now correctly match normalized statuses

### 2. Status Display Mismatch
**Problem**: Status labels displayed on work orders didn't match filter options.

**Root Cause**:
- Work orders were displaying raw statuses (e.g., "已提交", "待評估")
- Filter options were using normalized status labels (e.g., "待處理", "處理中")
- No consistent mapping between raw and normalized statuses

**Solution**:
- All work orders now display normalized status labels consistently
- Both display and filter use the same normalized status system:
  - `pending` → "待處理"
  - `in_progress` → "處理中"
  - `completed` → "已完成"
  - `cancelled` → "已取消"

## Changes Made

### Files Modified

1. **`components/maintenance/TicketList.tsx`**
   - Removed status parameter from API call
   - Added `useCallback` for `normalizeStatus` and `fetchWorkOrders`
   - Fixed `useEffect` dependencies to include `normalizeStatus`
   - All filtering now happens client-side after fetching

2. **`components/warehouse/Dashboard.tsx`**
   - Filtering already happening client-side (no API changes needed)
   - Verified filter dependencies are correct

3. **`app/api/maintenance/tickets/route.ts`**
   - Added support for `supplierId` parameter for supplier admin filtering
   - No changes needed for regular filtering (now handled client-side)

## Status Normalization

### Maintenance Tickets
- `PENDING_EVALUATION`, `open`, `pending` → `pending` (待處理)
- `evaluated`, `assigned`, `in_progress`, `work_completed`, `signed_off_by_crew`, `signed_off_by_supplier` → `in_progress` (處理中)
- `closed`, `signed_off_by_household`, `resolved` → `completed` (已完成)
- `cancelled` → `cancelled` (已取消)

### Catering Orders
- `submitted`, `accepted` → `pending` (待處理)
- `preparing`, `ready` → `in_progress` (處理中)
- `delivered`, `closed` → `completed` (已完成)
- `cancelled` → `cancelled` (已取消)

## Testing

After deployment, verify:
1. ✅ Filter dropdown shows: 全部狀態, 待處理, 處理中, 已完成, 已取消
2. ✅ Selecting a filter actually filters the work orders
3. ✅ Status badges on work orders match filter options
4. ✅ Both Dashboard and TicketList filters work correctly

## Deployment

Changes have been committed and pushed to `main` branch. Vercel will automatically deploy.

**Commit**: `85749b1` - "Remove debug logging from filter components"
**Previous**: `3f6da4f` - "Add supplier admin system with auto-routing and fix work order filter issues"

## Next Steps

1. **Database Migration**: Run `prisma/migrations/add-supplier-member-table.sql` to add supplier admin support
2. **Test Filters**: Verify filters work correctly after deployment
3. **Monitor**: Check browser console for any filter-related errors
