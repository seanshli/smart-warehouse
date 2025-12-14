# Post-Migration Checklist & Next Steps

## ✅ Migration Complete

The database migration has been successfully run in Supabase. The following tables have been created:
- ✅ `conversations` - Chat conversations
- ✅ `call_sessions` - Video/audio call sessions  
- ✅ `chat_history` - Admin viewable chat history

## ✅ Prisma Client Regenerated

The Prisma client has been regenerated with the new schema:
```bash
npx prisma generate
```

## 🔍 Verification Steps

### 1. Verify Tables Exist in Supabase

Run these queries in Supabase SQL Editor:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'call_sessions', 'chat_history')
ORDER BY table_name;

-- Expected: 3 rows returned
```

### 2. Verify Columns

```sql
-- Check call_sessions columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'call_sessions' 
AND column_name IN ('household_id', 'target_household_id', 'rejection_reason', 'conversation_id')
ORDER BY column_name;

-- Expected: All 4 columns exist, conversation_id should be nullable
```

### 3. Verify Indexes

```sql
-- Check indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('conversations', 'call_sessions', 'chat_history')
ORDER BY tablename, indexname;

-- Expected: Multiple indexes for each table
```

## 🧪 Test Features

### 1. Test Reservations (Auto-Reject)
- ✅ **Already Implemented**: `app/api/facility/[id]/reservations/route.ts`
- Test: Try to reserve a time slot that's already occupied
- Expected: Should return `errorCode: 'TIME_OCCUPIED'` and `rejectionReason`

### 2. Test Calls (Auto-Reject)
- ✅ **Already Implemented**: 
  - `app/api/conversations/[id]/calls/route.ts`
  - `app/api/household/[id]/chat/[targetHouseholdId]/call/route.ts`
- Test: Try to make a call when another call is active
- Expected: Should create `CallSession` with `status: 'auto-rejected'` and `rejectionReason`

### 3. Test Chat History (Admin View)
- ✅ **Already Implemented**: `app/api/admin/chat-history/route.ts`
- Test: Access `/admin/chat-history` page as admin
- Expected: Should display chat history with filters

### 4. Test Chat Message Recording
- ⚠️ **Needs Implementation**: Messages need to be saved to `chat_history` table
- Check: `app/api/conversations/[id]/messages/route.ts`
- Check: `app/api/household/[id]/chat/[targetHouseholdId]/messages/route.ts`
- Check: `app/api/building/[id]/door-bell/[doorBellId]/message/route.ts`

## 📋 Next Steps

### Priority 1: Test Chat History Recording

✅ **Already Implemented!** All message endpoints already save to `chat_history`:

1. ✅ **Conversation Messages** (`app/api/conversations/[id]/messages/route.ts` lines 170-193)
   - Saves to `chat_history` with `receiverType: 'frontdesk'` or `'household'`

2. ✅ **Household-to-Household Messages** (`app/api/household/[id]/chat/[targetHouseholdId]/messages/route.ts` lines 123-140)
   - Saves to `chat_history` with `receiverType: 'household'` and `targetHouseholdId`

3. ✅ **Doorbell Messages** (`app/api/building/[id]/door-bell/[doorBellId]/message/route.ts` lines 84-102)
   - Saves to `chat_history` with `receiverType: 'frontdoor'`

**Next**: Test that messages are being saved correctly by checking the admin chat history page.

### Priority 2: Test Auto-Reject Features

1. **Reservations**:
   - Create a reservation for a facility
   - Try to create another reservation for the same time slot
   - Verify it's auto-rejected with `TIME_OCCUPIED` error code

2. **Calls**:
   - Start a call between two households
   - Try to start another call while the first is active
   - Verify the second call is auto-rejected with `rejectionReason`

### Priority 3: Verify Admin Chat History Page

1. Access `/admin/chat-history` as admin
2. Verify:
   - Page loads without errors
   - Filters work (householdId, buildingId, receiverType, date range)
   - Pagination works
   - Building admins can only see their buildings' conversations

## 🐛 Troubleshooting

### If Prisma Client Errors Occur

```bash
# Regenerate Prisma client
npx prisma generate

# If schema is out of sync, pull from database
npx prisma db pull

# Then regenerate
npx prisma generate
```

### If Tables Don't Exist

1. Check Supabase SQL Editor for errors
2. Re-run `MIGRATION_FIXED_FOR_SUPABASE.sql`
3. Verify all steps completed successfully

### If Foreign Key Errors Occur

The migration handles foreign keys safely. If you see errors:
1. Check if `households` table exists
2. Check if `users` table exists
3. Check if `buildings` table exists (optional)

## 📊 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Database Migration | ✅ Complete | Tables created successfully |
| Prisma Client | ✅ Regenerated | Ready to use |
| Reservation Auto-Reject | ✅ Implemented | Needs testing |
| Call Auto-Reject | ✅ Implemented | Needs testing |
| Chat History API | ✅ Implemented | Needs testing |
| Chat Message Recording | ✅ Implemented | Already saving to chat_history in all endpoints |
| Admin Chat History Page | ✅ Implemented | Needs testing |

## 🎯 Immediate Action Items

1. ✅ **DONE**: Run migration in Supabase
2. ✅ **DONE**: Regenerate Prisma client
3. ✅ **DONE**: Chat message recording already implemented
4. ⏭️ **NEXT**: Test reservation auto-reject
5. ⏭️ **NEXT**: Test call auto-reject
6. ⏭️ **NEXT**: Test admin chat history page
7. ⏭️ **NEXT**: Verify chat messages are being saved to `chat_history` table
