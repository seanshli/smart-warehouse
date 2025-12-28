# Community/Building Admin Access Control

## Overview

This document describes the access control system for community and building administrators. Community admins can only access their own communities, and building admins can only access their own buildings.

## Access Control Implementation

### 1. JWT Token (Authentication)

The JWT token now includes:
- `isCommunityAdmin`: Boolean indicating if user is a community admin
- `communityIds`: Array of community IDs the user administers
- `isBuildingAdmin`: Boolean indicating if user is a building admin
- `buildingIds`: Array of building IDs the user administers

These are set in `lib/auth.ts` during the JWT callback.

### 2. Middleware Protection (`middleware-admin.ts`)

The middleware enforces route-level access control:

- **Super Admin**: Can access all admin routes
- **Community Admin**: Can only access `/admin/communities/[id]/*` routes where `[id]` matches one of their `communityIds`
- **Building Admin**: Can only access `/admin/buildings/[id]/*` routes where `[id]` matches one of their `buildingIds`
- **Supplier Admin**: Can only access `/admin/suppliers/[id]/*` routes where `[id]` matches one of their `supplierIds`

### 3. API Endpoint Protection

#### Community API (`/api/admin/communities/[id]`)
- Verifies user is super admin OR community admin for the specific community
- Returns 403 if user is not authorized

#### Building API (`/api/admin/buildings/[id]`)
- Verifies user is super admin OR building admin for the specific building
- Returns 403 if user is not authorized

#### Maintenance Tickets API (`/api/maintenance/tickets`)
- **Community Admin**: Automatically filters tickets to only show those from households in their communities
- **Building Admin**: Automatically filters tickets to only show those from households in their buildings
- If `communityId` or `buildingId` is provided, verifies the user has access to that specific community/building

#### Catering Orders API (`/api/catering/orders`)
- **Community Admin**: Automatically filters orders to only show those from households in their communities
- **Building Admin**: Automatically filters orders to only show those from households in their buildings
- If `communityId` or `buildingId` is provided, verifies the user has access to that specific community/building

## Setting Up User Credentials via SQL

To set up credentials for a community or building admin user, use the following SQL:

### Step 1: Check if user exists

```sql
SELECT id, email, name, "isAdmin" 
FROM users 
WHERE email = 'ad.twinoak@twinoak.com';
```

### Step 2: Check if user has credentials

```sql
SELECT 
    u.email, 
    uc.password IS NOT NULL as has_credentials
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
WHERE u.email = 'ad.twinoak@twinoak.com';
```

### Step 3: Generate password hash

You can generate a bcrypt hash using Node.js:

```bash
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('your-password-here',12).then(h=>console.log(h))"
```

Or use an online bcrypt generator (ensure it uses 12 rounds).

### Step 4: Set up credentials

```sql
-- Set up credentials for the user
WITH user_info AS (
    SELECT id FROM users WHERE email = 'ad.twinoak@twinoak.com'
)
INSERT INTO user_credentials ("user_id", password, created_at, updated_at)
SELECT 
    id,
    '$2a$12$YOUR_BCRYPT_HASH_HERE', -- Replace with actual bcrypt hash
    NOW(),
    NOW()
FROM user_info
ON CONFLICT ("user_id") DO UPDATE SET
    password = EXCLUDED.password,
    updated_at = NOW();
```

### Step 5: Verify credentials are set

```sql
SELECT 
    u.id, 
    u.email, 
    u.name, 
    u."isAdmin",
    uc.password IS NOT NULL as has_credentials
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc."user_id"
WHERE u.email = 'ad.twinoak@twinoak.com';
```

### Step 6: Verify community/building admin role

```sql
-- Check community admin roles
SELECT 
    u.email,
    cm.role,
    c.id as community_id,
    c.name as community_name
FROM users u
JOIN community_members cm ON u.id = cm.user_id
JOIN communities c ON cm.community_id = c.id
WHERE u.email = 'ad.twinoak@twinoak.com'
AND cm.role = 'ADMIN';

-- Check building admin roles
SELECT 
    u.email,
    bm.role,
    b.id as building_id,
    b.name as building_name
FROM users u
JOIN building_members bm ON u.id = bm.user_id
JOIN buildings b ON bm.building_id = b.id
WHERE u.email = 'ad.twinoak@twinoak.com'
AND bm.role = 'ADMIN';
```

## Complete Setup Script

Here's a complete SQL script to set up credentials for a community admin:

```sql
-- 1. Verify user exists and get user ID
DO $$
DECLARE
    v_user_id TEXT;
    v_password_hash TEXT := '$2a$12$YOUR_BCRYPT_HASH_HERE'; -- Replace with actual hash
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM users
    WHERE email = 'ad.twinoak@twinoak.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: ad.twinoak@twinoak.com';
    END IF;
    
    -- Create or update credentials
    INSERT INTO user_credentials ("user_id", password, created_at, updated_at)
    VALUES (v_user_id, v_password_hash, NOW(), NOW())
    ON CONFLICT ("user_id") DO UPDATE SET
        password = EXCLUDED.password,
        updated_at = NOW();
    
    RAISE NOTICE 'Credentials set up for user: ad.twinoak@twinoak.com';
END $$;

-- 2. Verify setup
SELECT 
    u.email,
    u.name,
    uc.password IS NOT NULL as has_credentials,
    (SELECT COUNT(*) FROM community_members cm 
     WHERE cm.user_id = u.id AND cm.role = 'ADMIN') as community_admin_count,
    (SELECT COUNT(*) FROM building_members bm 
     WHERE bm.user_id = u.id AND bm.role = 'ADMIN') as building_admin_count
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc."user_id"
WHERE u.email = 'ad.twinoak@twinoak.com';
```

## Testing Access

After setting up credentials:

1. **Login**: User should be able to log in at `/admin-auth/signin`
2. **Community Admin**: Should only see their own communities in the admin panel
3. **Building Admin**: Should only see their own buildings in the admin panel
4. **Work Orders**: Should only see work orders from their communities/buildings
5. **Catering Orders**: Should only see catering orders from their communities/buildings

## Troubleshooting

### User cannot log in
- Verify credentials exist: `SELECT * FROM user_credentials WHERE user_id = (SELECT id FROM users WHERE email = '...')`
- Verify password hash is correct (bcrypt with 12 rounds)
- Check browser console for authentication errors

### User can log in but cannot access admin pages
- Verify community/building membership: Check `community_members` or `building_members` tables
- Verify role is 'ADMIN': `SELECT * FROM community_members WHERE user_id = ... AND role = 'ADMIN'`
- Check JWT token in browser DevTools → Application → Cookies → `next-auth.session-token`
- Clear cookies and log in again to refresh JWT token

### User can access admin pages but sees wrong data
- Verify middleware is correctly filtering by `communityIds`/`buildingIds`
- Check API endpoint logs for filtering logic
- Verify database relationships (household → building → community)

## Security Notes

- All password hashes must use bcrypt with at least 12 rounds
- Never store plain text passwords
- Community/building admins cannot access other communities/buildings even if they know the IDs
- Super admins retain full access to all communities/buildings
- Access control is enforced at both middleware and API endpoint levels
