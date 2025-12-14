# ✅ Ready to Run - Step by Step

## Status Check ✅

- ✅ DATABASE_URL found in `.env.local`
- ✅ Migration script created: `scripts/run-migration.sh`
- ✅ Prisma client regenerated
- ✅ Code fixes applied and committed

## 🚀 Run Migration Now

**Step 1: Run the migration script**

```bash
cd /Users/seanli/smart-warehouse
./scripts/run-migration.sh
```

This will:
1. Load DATABASE_URL from `.env.local`
2. Run the migration to create ChatHistory table
3. Update CallSession table for auto-reject

**Expected Output:**
```
🔧 Setting up environment for Prisma migration...
📄 Loading .env.local...
✅ DATABASE_URL found
🚀 Running Prisma migration...
✅ Migration complete!
```

## 🧪 Test After Migration

**Step 2: Test Reservation Creation**

1. Start dev server (if not running):
   ```bash
   npm run dev
   ```

2. Open reservation form:
   - Navigate to facility reservation page
   - Click "New Reservation"
   - Check time inputs show 24-hour format
   - Try creating a reservation

3. Check for errors:
   - If reservation fails, check error message (should be detailed now)
   - Check browser console for full error details
   - Check server logs for Prisma error codes

## ✅ Verification Checklist

After running migration:

- [ ] Migration completed successfully
- [ ] ChatHistory table created in database
- [ ] CallSession table updated (household_id, target_household_id, rejection_reason columns)
- [ ] Reservation creation works
- [ ] Time inputs show correct format
- [ ] Error messages are detailed (if any errors occur)

## 🔍 If Migration Fails

If you see errors:

1. **DATABASE_URL not found**: 
   - Check `.env.local` exists and has DATABASE_URL
   - Or manually export: `export DATABASE_URL="your-url"`

2. **Connection error**:
   - Verify database is accessible
   - Check network connection
   - Verify credentials in DATABASE_URL

3. **Table already exists**:
   - Migration may have partially run
   - Check database manually
   - May need to rollback and retry

## 📝 Quick Commands

```bash
# Run migration
./scripts/run-migration.sh

# Check migration status (after setting DATABASE_URL)
export $(cat .env.local | grep DATABASE_URL | xargs)
npx prisma migrate status

# Start dev server
npm run dev

# Regenerate Prisma client (if needed)
npx prisma generate
```

---

**You're all set! Run `./scripts/run-migration.sh` now.** 🚀


