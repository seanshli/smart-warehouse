# Password Reset Guide for Admin Users

## Issue: "Invalid credentials" error during login

If you're getting "Invalid credentials" even though credentials exist in the database, the password hash may be incorrect or the password doesn't match.

## Solution: Reset Password via API

### Step 1: Test Current Password

First, test if the password works:

```bash
curl -X POST https://smart-warehouse-five.vercel.app/api/admin/test-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ad.twinoak@twinoak.com",
    "password": "your-current-password"
  }'
```

This will tell you:
- If the password hash format is correct
- If the password matches
- What the issue is

### Step 2: Reset Password via API (Requires Super Admin Login)

**Option A: Using the API endpoint (if you have super admin access)**

1. First, log in as a super admin
2. Then call the setup endpoint:

```bash
curl -X POST https://smart-warehouse-five.vercel.app/api/admin/setup-user-credentials \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "email": "ad.twinoak@twinoak.com",
    "password": "new-password-here"
  }'
```

**Option B: Using SQL (Direct Database Access)**

If you have direct database access, you can reset the password:

```sql
-- Step 1: Generate password hash using Node.js
-- Run this command locally:
-- node -e "const bcrypt=require('bcryptjs');bcrypt.hash('your-new-password',12).then(h=>console.log(h))"

-- Step 2: Update the password hash in database
WITH user_info AS (
    SELECT id FROM users WHERE email = 'ad.twinoak@twinoak.com'
)
UPDATE user_credentials
SET 
    password = '$2a$12$YOUR_NEW_BCRYPT_HASH_HERE', -- Replace with hash from step 1
    updated_at = NOW()
WHERE user_id = (SELECT id FROM user_info);

-- Step 3: Verify the update
SELECT 
    u.email,
    uc.password IS NOT NULL as has_password,
    LEFT(uc.password, 7) as hash_prefix,
    LENGTH(uc.password) as hash_length
FROM users u
JOIN user_credentials uc ON u.id = uc.user_id
WHERE u.email = 'ad.twinoak@twinoak.com';
```

### Step 3: Verify Password Works

After resetting, test the password again:

```bash
curl -X POST https://smart-warehouse-five.vercel.app/api/admin/test-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ad.twinoak@twinoak.com",
    "password": "your-new-password"
  }'
```

You should see:
```json
{
  "passwordVerification": {
    "passwordMatches": true
  }
}
```

### Step 4: Try Login Again

Go to `/admin-auth/signin` and log in with:
- Email: `ad.twinoak@twinoak.com`
- Password: Your new password

## Common Issues

### Issue 1: Password hash format incorrect

**Symptoms:**
- `isValidBcryptFormat: false` in test response
- Hash doesn't start with `$2a$`, `$2b$`, or `$2y$`

**Solution:**
- The hash was likely created incorrectly
- Use the API endpoint to reset (it uses proper bcrypt hashing)

### Issue 2: Wrong number of rounds

**Symptoms:**
- Hash format is correct but verification fails
- `expectedRounds` shows a different number than 12

**Solution:**
- Ensure you're using 12 rounds when generating the hash
- The API endpoint uses 12 rounds by default

### Issue 3: Password doesn't match

**Symptoms:**
- `passwordMatches: false`
- Hash format is correct

**Solution:**
- The password you're entering doesn't match what's stored
- Reset the password using one of the methods above

## Quick Fix Script

If you have database access and want to quickly reset the password:

```sql
-- Quick password reset (replace 'newpassword' with actual password)
-- First generate hash: node -e "const bcrypt=require('bcryptjs');bcrypt.hash('newpassword',12).then(h=>console.log(h))"
-- Then update:

UPDATE user_credentials
SET password = '$2a$12$GENERATED_HASH_HERE',
    updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'ad.twinoak@twinoak.com');
```

## Testing After Reset

1. **Test password verification:**
   ```bash
   curl -X POST https://smart-warehouse-five.vercel.app/api/admin/test-password \
     -H "Content-Type: application/json" \
     -d '{"email":"ad.twinoak@twinoak.com","password":"your-password"}'
   ```

2. **Try login:**
   - Go to `/admin-auth/signin`
   - Enter email and password
   - Should successfully log in

3. **Verify admin context:**
   - After login, check `/api/admin/context`
   - Should show community/building admin roles
