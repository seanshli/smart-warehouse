# Fix Reservation Issues

## Issue 1: Time Format Still Showing 12-hour AM/PM

**Problem**: HTML5 time inputs display in 12-hour format based on browser locale, even with labels saying "(24hr)".

**Solution Applied**:
- Added `lang="en"` attribute to force English locale
- Added `pattern="[0-9]{2}:[0-9]{2}"` to enforce 24-hour format
- Browser may still show 12-hour format in some locales, but the value stored is always 24-hour

**Note**: HTML5 time inputs are browser-dependent. For guaranteed 24-hour display, consider:
- Using a custom time picker component
- Adding CSS to hide AM/PM indicators
- Using a text input with pattern validation

## Issue 2: Reservation Creation Failing

**Error**: `PrismaClientKnownRequestError` (500 Internal Server Error)

**Possible Causes**:
1. Prisma client needs regeneration after schema changes
2. Database migration not run (ChatHistory table missing)
3. Database connection issue

**Solutions**:

### Step 1: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 2: Run Database Migration
```bash
# First, ensure DATABASE_URL is set (see Issue 3)
npx prisma migrate dev --name add_chat_history_and_call_auto_reject
```

### Step 3: Check Error Details
The error message should now include more details. Check browser console or server logs for the full error.

## Issue 3: Prisma Migration Error - DATABASE_URL Not Found

**Error**: `Environment variable not found: DATABASE_URL`

**Solution**:

### Option 1: Check Existing .env Files
```bash
# Check if .env.local exists
cat .env.local | grep DATABASE_URL

# Check if .env exists
cat .env | grep DATABASE_URL
```

### Option 2: Create .env File
Create a `.env` or `.env.local` file in the project root:

```bash
# For Supabase/PostgreSQL
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Example:
DATABASE_URL="postgresql://postgres:password@localhost:5432/smartwarehouse?schema=public"
```

### Option 3: Use Environment Variable
```bash
export DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
npx prisma migrate dev --name add_chat_history_and_call_auto_reject
```

### Option 4: Check Supabase Config
If using Supabase, check `supabase-config.env` or similar files for the connection string.

## Quick Fix Commands

```bash
# 1. Regenerate Prisma client
npx prisma generate

# 2. Set DATABASE_URL (if not in .env)
export DATABASE_URL="your-database-url-here"

# 3. Run migration
npx prisma migrate dev --name add_chat_history_and_call_auto_reject

# 4. Restart dev server
npm run dev
```

## Verification

After fixing:
1. ✅ Time inputs should show 24-hour format (may vary by browser)
2. ✅ Reservation creation should work
3. ✅ Migration should complete successfully
