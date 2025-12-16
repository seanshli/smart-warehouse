# Detailed Implementation Plan - Round 4 Issues

## Overview
This document outlines the detailed implementation plan for fixing all 6 issues reported in Round 4.

---

## Issue 1: Worker Group Access from Building Admin Page

### Problem
Cannot access worker groups from building admin page.

### Current State
- Working groups tab exists in `/app/building/[id]/page.tsx`
- Tab ID: `working-groups`
- Component: `WorkingGroupsTab`
- Tab is rendered conditionally: `{activeTab === 'working-groups' && buildingId && building && ...}`

### Root Cause Analysis
1. Check if tab is visible in navigation
2. Check permissions for building admins
3. Verify API endpoint accessibility
4. Check if communityId is properly passed

### Implementation Steps

#### Step 1.1: Verify Tab Visibility
**File**: `app/building/[id]/page.tsx`
- Check line ~219: Ensure `working-groups` tab is in the tabs array
- Verify tab is not conditionally hidden
- Check if tab name is properly translated

#### Step 1.2: Check Permissions
**File**: `app/api/building/[id]/working-groups/route.ts` (if exists)
- Verify building admin can access working groups API
- Check if `buildingId` validation is correct
- Ensure building admins have read access

#### Step 1.3: Fix Access Issues
**Actions**:
1. If API doesn't exist, create: `/app/api/building/[id]/working-groups/route.ts`
2. Ensure building admins can read working groups
3. Add error handling for permission denied cases
4. Add loading states

### Expected Outcome
- Building admins can click "Working Groups" tab
- Tab loads working groups for that building
- No permission errors

---

## Issue 2: Button Links Not Connected

### Problem
Buttons (預定, 報修, 物業) are not properly linked to their respective pages.

### Current State
- 預定: Links to `/household/${household.id}/reservation`
- 報修: Links to `/household/${household.id}/maintenance`
- 物業: Has dropdown with mail, package, visitor links

### Root Cause Analysis
1. Pages may not exist at those routes
2. Links may need to point to admin pages with filters
3. Need to verify household context is preserved

### Implementation Steps

#### Step 2.1: Fix 預定 (Reservation) Link
**File**: `app/building/[id]/page.tsx` (line ~860)

**Option A**: Link to admin facilities page with household filter
```typescript
href={`/admin/facilities/building/${buildingId}?householdId=${household.id}&tab=reservations`}
```

**Option B**: Create household-specific reservation page
- Create: `app/household/[id]/reservation/page.tsx`
- Fetch reservations filtered by householdId
- Show reservation requests from that household

**Recommended**: Option A (use existing admin page with filter)

#### Step 2.2: Fix 報修 (Maintenance) Link
**File**: `app/building/[id]/page.tsx` (line ~869)

**Option A**: Link to admin maintenance page with household filter
```typescript
href={`/admin/maintenance?householdId=${household.id}`}
```

**Option B**: Create household-specific maintenance page
- Create: `app/household/[id]/maintenance/page.tsx`
- Fetch maintenance tickets filtered by householdId
- Show maintenance requests from that household

**Recommended**: Option A (use existing admin page with filter)

#### Step 2.3: Fix 物業 (Property) Links
**File**: `app/building/[id]/page.tsx` (line ~887-906)

**Current links**:
- Mail: `/household/${household.id}/property/mail`
- Package: `/household/${household.id}/property/package`
- Visitor: `/household/${household.id}/property/visitor`

**Fix**: Update to use building context
- Mail: `/building/${buildingId}?tab=mailboxes&householdId=${household.id}`
- Package: `/building/${buildingId}?tab=packages&householdId=${household.id}`
- Doorbell: `/building/${buildingId}?tab=frontdoor&householdId=${household.id}`

**Alternative**: Create property management pages
- Create: `app/household/[id]/property/[type]/page.tsx`
- Types: mail, package, doorbell

**Recommended**: Use building tabs with household filter

### Expected Outcome
- 預定 button shows reservations for that household
- 報修 button shows maintenance tickets for that household
- 物業 dropdown links work correctly (mailbox, package, doorbell)

---

## Issue 3: Household Messaging - Building Admin

### Problem
1. Building admin cannot message households
2. Households that have moved in should be active (different color)
3. Need front desk options for community and building levels

### Current State
- ConversationList component exists
- FrontDeskChatButton exists
- API: `/api/conversations` supports buildingId filter
- No auto-creation of conversations for households
- No active/inactive status indicators

### Implementation Steps

#### Step 3.1: Auto-Create Conversations for Active Households
**File**: `app/api/conversations/route.ts`

**Logic**:
1. When building admin views conversations, check all households in building
2. For each household with members (active), ensure a conversation exists
3. Create conversation if it doesn't exist
4. Type: `household` or `admin_household`

**Implementation**:
```typescript
// In GET handler, after fetching existing conversations
if (buildingId) {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    include: {
      households: {
        include: {
          members: true
        }
      }
    }
  })
  
  // Create conversations for active households
  for (const household of building.households) {
    if (household.members.length > 0) {
      // Check if conversation exists
      const existing = await prisma.conversation.findFirst({
        where: {
          householdId: household.id,
          buildingId: buildingId,
          type: 'admin_household'
        }
      })
      
      if (!existing) {
        // Create conversation
        await prisma.conversation.create({
          data: {
            householdId: household.id,
            buildingId: buildingId,
            type: 'admin_household',
            status: 'active',
            createdBy: userId
          }
        })
      }
    }
  }
}
```

#### Step 3.2: Add Active/Inactive Status Indicators
**File**: `components/messaging/ConversationList.tsx`

**Changes**:
1. Fetch household member count in conversation query
2. Add status indicator (green dot for active, gray for inactive)
3. Style conversations differently based on status

**Implementation**:
```typescript
// In conversation card
{household.members.length > 0 ? (
  <div className="flex items-center">
    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
    <span className="text-xs text-green-600">Active</span>
  </div>
) : (
  <div className="flex items-center">
    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
    <span className="text-xs text-gray-500">Inactive</span>
  </div>
)}
```

#### Step 3.3: Add Community/Building Front Desk Options
**File**: `components/messaging/ConversationList.tsx`

**Changes**:
1. Add "Community Front Desk" button if communityId is provided
2. Add "Building Front Desk" button if buildingId is provided
3. Update FrontDeskChatButton to support communityId

**Implementation**:
```typescript
// Add to ConversationList
{communityId && (
  <FrontDeskChatButton 
    communityId={communityId}
    className="w-full justify-center mb-2"
  />
)}
{buildingId && (
  <FrontDeskChatButton 
    buildingId={buildingId}
    className="w-full justify-center mb-2"
  />
)}
```

### Expected Outcome
- All active households have conversations visible
- Active households show green indicator
- Inactive households show gray indicator
- Front desk buttons for both community and building levels

---

## Issue 4: Language Selection & Navigation

### Problem
1. Missing language selection on messaging pages
2. Missing "Back to Super User Admin Home" button
3. Messages not synced with selected language

### Current State
- LanguageProvider exists
- Language selector exists in admin layout
- Messaging pages don't have language selector
- Back button exists but doesn't go to admin home

### Implementation Steps

#### Step 4.1: Add Language Selector to Messaging Pages
**Files**:
- `app/building/[id]/messages/page.tsx`
- `app/community/[id]/messages/page.tsx`

**Implementation**:
```typescript
import { useLanguage } from '@/components/LanguageProvider'

// In component
const { currentLanguage, setLanguage, t } = useLanguage()

// Add to header
<select
  value={currentLanguage}
  onChange={(e) => setLanguage(e.target.value)}
  className="px-3 py-2 border rounded-md"
>
  <option value="en">English</option>
  <option value="zh-TW">繁體中文</option>
  <option value="zh">简体中文</option>
  <option value="ja">日本語</option>
</select>
```

#### Step 4.2: Add Back to Admin Home Button
**Files**:
- `app/building/[id]/messages/page.tsx`
- `app/community/[id]/messages/page.tsx`

**Implementation**:
```typescript
import Link from 'next/link'
import { useSession } from 'next-auth/react'

// Check if user is admin
const { data: session } = useSession()
const isAdmin = (session?.user as any)?.isAdmin

// Add button
{isAdmin && (
  <Link
    href="/admin"
    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
  >
    <HomeIcon className="h-5 w-5 mr-2" />
    {t('backToAdminHome') || 'Back to Admin Home'}
  </Link>
)}
```

#### Step 4.3: Sync Messages with Language
**File**: `components/messaging/ChatInterface.tsx`

**Changes**:
1. Use translation keys for message types
2. Format dates according to language
3. Use translated labels for UI elements

**Implementation**:
- Already using `t()` function
- Ensure all hardcoded strings use translation keys
- Add missing translation keys if needed

### Expected Outcome
- Language selector visible on messaging pages
- "Back to Admin Home" button visible for admins
- All messages and UI elements respect selected language

---

## Issue 5: Convert Horizontal Tabs to Vertical Sidebar

### Problem
Horizontal tab navigation should be converted to vertical scrollable sidebar.

### Current State
- Tabs are horizontal in `app/building/[id]/page.tsx`
- Tabs array defined around line 211-220
- Uses flex layout with horizontal spacing

### Implementation Steps

#### Step 5.1: Create Vertical Sidebar Layout
**File**: `app/building/[id]/page.tsx`

**Changes**:
1. Move tabs to left sidebar
2. Make sidebar scrollable
3. Keep content area on right
4. Update responsive design

**Layout Structure**:
```typescript
<div className="flex h-screen">
  {/* Left Sidebar */}
  <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
    <nav className="p-4 space-y-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${
            activeTab === tab.id
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span>{tab.name}</span>
        </button>
      ))}
    </nav>
  </div>
  
  {/* Right Content Area */}
  <div className="flex-1 overflow-y-auto">
    {/* Tab content */}
  </div>
</div>
```

#### Step 5.2: Update Admin Layout (if needed)
**File**: `app/admin/layout.tsx`

**Considerations**:
- May need similar sidebar for admin pages
- Keep consistent with building page layout
- Ensure mobile responsiveness

#### Step 5.3: Add Responsive Design
**Changes**:
- On mobile: Collapse sidebar to hamburger menu
- On tablet: Show sidebar as overlay
- On desktop: Show sidebar permanently

### Expected Outcome
- Tabs displayed vertically in left sidebar
- Sidebar is scrollable
- Content area on right
- Responsive design works on all screen sizes

---

## Issue 6: Job Type to Supplier Type Assignment

### Problem
At super admin level, need to assign job types (categories) to specific suppliers.

### Current State
- Job routing API exists: `/api/admin/job-routing`
- Current routing: Category → Routing Type (INTERNAL_BUILDING, INTERNAL_COMMUNITY, EXTERNAL_SUPPLIER)
- No direct supplier assignment per category
- Evaluation modal allows selecting supplier but not per category

### Implementation Steps

#### Step 6.1: Enhance Job Routing Configuration
**File**: `app/api/admin/job-routing/route.ts`

**Changes**:
1. Add supplier assignment per category
2. Store configuration in database (create table if needed)
3. Support both routing type and specific supplier

**Database Schema** (if needed):
```sql
CREATE TABLE job_routing_config (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  routing_type TEXT NOT NULL,
  supplier_id TEXT, -- NULL for internal routing
  crew_id TEXT, -- NULL for external routing
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Response**:
```typescript
{
  category: 'WATER_FILTER',
  routingType: 'EXTERNAL_SUPPLIER',
  supplierId: 'supplier-123',
  supplierName: 'enGo Water Filter Supplier'
}
```

#### Step 6.2: Update Job Routing Page
**File**: `app/admin/settings/job-routing/page.tsx`

**Changes**:
1. Add supplier selection per category
2. Show assigned supplier name
3. Allow changing supplier assignment

**UI Enhancement**:
```typescript
{category} → {routingType}
  ↓
  If EXTERNAL_SUPPLIER:
    [Select Supplier Dropdown]
    Current: {supplierName}
```

#### Step 6.3: Update Evaluation Modal
**File**: `app/admin/maintenance/page.tsx`

**Changes**:
1. Pre-select supplier based on category routing config
2. Show "Assigned Supplier" from config
3. Allow override if needed

**Implementation**:
```typescript
// Fetch routing config for ticket category
const routingConfig = await fetch(`/api/admin/job-routing?category=${ticket.category}`)
const config = await routingConfig.json()

// Pre-fill supplier if configured
if (config.supplierId) {
  setAssignedId(config.supplierId)
  setRoutingType('EXTERNAL_SUPPLIER')
}
```

#### Step 6.4: Update Ticket Creation
**File**: `app/api/maintenance/tickets/route.ts`

**Changes**:
1. Check routing config when creating ticket
2. Auto-assign supplier if configured
3. Set routingType based on config

### Expected Outcome
- Super admin can assign specific suppliers to job categories
- Tickets auto-assign to configured supplier
- Evaluation modal shows pre-selected supplier
- Can override assignment if needed

---

## Implementation Priority

### Phase 1: Critical Fixes (Do First)
1. **Issue 2**: Fix button links (預定, 報修, 物業)
2. **Issue 4**: Add language selector and back button
3. **Issue 1**: Verify/fix worker group access

### Phase 2: Important Enhancements
4. **Issue 3**: Household messaging enhancements
5. **Issue 6**: Job routing supplier assignment

### Phase 3: UI Improvements
6. **Issue 5**: Convert to vertical sidebar

---

## Testing Checklist

### Issue 1: Worker Groups
- [ ] Can access working groups tab from building page
- [ ] Working groups load correctly
- [ ] No permission errors

### Issue 2: Button Links
- [ ] 預定 button shows correct reservations
- [ ] 報修 button shows correct maintenance tickets
- [ ] 物業 links work (mailbox, package, doorbell)

### Issue 3: Messaging
- [ ] Active households have conversations
- [ ] Active/inactive status visible
- [ ] Front desk buttons work

### Issue 4: Language & Navigation
- [ ] Language selector visible
- [ ] Language changes work
- [ ] Back to admin home works

### Issue 5: Sidebar
- [ ] Vertical sidebar displays
- [ ] Sidebar scrollable
- [ ] Responsive design works

### Issue 6: Job Routing
- [ ] Can assign suppliers to categories
- [ ] Tickets auto-assign correctly
- [ ] Evaluation modal shows pre-selected supplier

---

## Files to Create/Modify

### New Files
1. `app/household/[id]/reservation/page.tsx` (if Option B for Issue 2)
2. `app/household/[id]/maintenance/page.tsx` (if Option B for Issue 2)
3. `prisma/migrations/XXXXXX_add_job_routing_config/migration.sql` (if database table needed)

### Modified Files
1. `app/building/[id]/page.tsx` - Fix links, add sidebar
2. `components/messaging/ConversationList.tsx` - Add status indicators, front desk options
3. `app/building/[id]/messages/page.tsx` - Add language selector, back button
4. `app/community/[id]/messages/page.tsx` - Add language selector, back button
5. `app/api/conversations/route.ts` - Auto-create conversations
6. `app/api/admin/job-routing/route.ts` - Add supplier assignment
7. `app/admin/settings/job-routing/page.tsx` - Add supplier selection UI
8. `app/admin/maintenance/page.tsx` - Pre-select supplier in modal
9. `app/api/maintenance/tickets/route.ts` - Auto-assign supplier

---

## Estimated Time

- **Phase 1**: 2-3 hours
- **Phase 2**: 3-4 hours
- **Phase 3**: 2-3 hours
- **Total**: 7-10 hours

---

## Notes

- All changes should maintain backward compatibility
- Test thoroughly before deploying
- Update documentation as needed
- Consider user feedback during implementation
