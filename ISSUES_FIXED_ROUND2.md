# Issues Fixed - Round 2

## ✅ Fixed Issues

### 1. ✅ Chat Creation Failure - FIXED
**Problem**: `PrismaClientKnownRequestError` when creating front desk chat

**Root Cause**: When `buildingId` is null, the code didn't find a fallback admin user to be the conversation creator.

**Fix Applied**:
- Updated `lib/messaging/permissions.ts` - Added fallback logic to find an admin user when `buildingId` is null
- Ensures conversation always has a valid creator even when household has no building

**Files Changed**:
- `lib/messaging/permissions.ts`

---

### 2. ✅ Merge Functionality - FIXED
**Problem**: 
- "Cannot merge item with itself" error
- Merge function failed for items/rooms/categories in different languages (e.g., "kitchen" vs "廚房")

**Root Cause**: 
- Merge logic was using the same item ID for both primary and duplicate
- No cross-language name normalization for duplicate detection

**Fix Applied**:
- Added `normalizeForComparison()` function to handle cross-language matching (Chinese ↔ English)
- Updated merge logic to find actual duplicate items (excluding the clicked item)
- Added validation in API to prevent merging item with itself
- Enhanced room merge to also move cabinets
- Fixed merge API to use correct variable names

**Files Changed**:
- `app/admin/duplicates/page.tsx` - Added normalization function and fixed merge logic
- `app/api/admin/merge-duplicates/route.ts` - Added validation and improved merge handling

---

## 🔄 In Progress / To Be Implemented

### 3. ⏳ Job Configuration to Working Team
**Requirement**: 
- At super admin level: Configure "job" (maintenance ticket category) routing to community/building level
- At super admin level: Set up hardware-to-supplier relationships
- At community/building admin level: Assign working crews to handle jobs

**Status**: Needs implementation
**Files to Create/Modify**:
- `app/admin/settings/job-routing/page.tsx` - Super admin job routing configuration
- `app/admin/settings/hardware-suppliers/page.tsx` - Hardware-to-supplier mapping
- `app/api/admin/job-routing/route.ts` - API for job routing configuration
- `app/api/admin/hardware-suppliers/route.ts` - API for hardware-supplier relationships
- Update `app/admin/maintenance/page.tsx` - Add crew assignment UI

---

### 4. ⏳ Public Facility Admin Page
**Requirement**: 
- Ability to enter public facility at admin page
- Review requests to use facilities
- Calendar update for facility reservations

**Status**: Needs implementation
**Files to Create/Modify**:
- `app/admin/facilities/page.tsx` - Public facility management page
- `app/api/admin/facilities/route.ts` - API for facility management
- `app/api/admin/facilities/[id]/reservations/route.ts` - API for facility reservations
- Fix "Failed to load facility" error

---

## 📋 Next Steps

1. **Implement Job Routing Configuration**:
   - Create super admin UI for configuring which ticket categories route to community vs building
   - Create UI for mapping hardware/service types to suppliers
   - Add crew assignment interface for community/building admins

2. **Implement Public Facility Admin Page**:
   - Create facility management page with tabs (包裹櫃, 訊息, 公共設施, 工作組, 公告)
   - Fix facility loading API
   - Add reservation review and calendar update functionality

3. **Testing**:
   - Test chat creation with null buildingId
   - Test merge functionality with cross-language duplicates
   - Test job routing and crew assignment
   - Test facility reservation management

---

**Last Updated**: $(date)
