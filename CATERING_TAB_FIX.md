# Catering Tab Visibility Fix

## Issues Fixed

### 1. ✅ Building Link 404 Fixed
**Problem**: The "建築" (Building) link from admin communities page was returning 404.

**Root Cause**: The `/admin/buildings` page wasn't reading the `communityId` query parameter from the URL.

**Solution**:
- Added URL search param reading using `window.location.search`
- Automatically sets `selectedCommunity` when `communityId` is in URL
- Link now works: `/admin/buildings?communityId=xxx`

### 2. ✅ Catering Tab Not Appearing
**Problem**: Catering tab not showing in sidebar even after enabling service.

**Root Causes**:
1. Service check might fail silently
2. State not updating properly after service is enabled
3. Timing issue - check runs before service is saved

**Solutions Applied**:
1. **Enhanced Service Check**:
   - Added `credentials: 'include'` to API calls
   - Better error handling and logging
   - Explicitly sets `cateringServiceEnabled` to `false` on error

2. **Auto-Refresh After Enable**:
   - Page automatically refreshes 1 second after enabling
   - Ensures tab appears immediately

3. **Service Check Refresh**:
   - Added callback to refresh service check after toggle
   - Runs 500ms after enabling to catch the new service

4. **Improved State Management**:
   - Added console logging for debugging
   - Explicit state updates on all code paths

## How It Works Now

### Building/Community Pages:
1. **On Page Load**: Checks if catering service is enabled
2. **If Enabled**: Shows "餐飲服務" (Catering) tab in sidebar
3. **On Enable**: 
   - Creates/enables service
   - Shows setup modal
   - Refreshes service check
   - Page auto-refreshes after 1 second
   - Tab appears in sidebar

### Admin Buildings Page:
1. **URL with communityId**: `/admin/buildings?communityId=xxx`
2. **Automatically filters**: Shows only buildings for that community
3. **No 404 error**: Link works correctly

## Testing

### Test Building Link:
1. Go to `/admin/communities`
2. Click "建築" (Building) link on any community
3. Should navigate to `/admin/buildings?communityId=xxx` and show filtered buildings
4. ✅ No 404 error

### Test Catering Tab:
1. Go to building or community detail page
2. Enable catering service (toggle in Overview tab)
3. Wait 1-2 seconds
4. Page should refresh
5. "餐飲服務" (Catering) tab should appear in sidebar
6. Click tab to see full menu
7. ✅ Tab visible and functional

## Debugging

If catering tab still doesn't appear:
1. Check browser console for: `[BuildingPage] Catering service status:`
2. Verify service is actually enabled in database
3. Check network tab for `/api/catering/service` response
4. Ensure `isActive: true` in service response

---

**Status**: ✅ Both issues fixed
**Build**: ✅ Successful
**Deployment**: ⏳ Auto-deploying
