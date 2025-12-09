# Link Home Assistant to Unit 3A

This guide explains how to link the Home Assistant server at `https://demoha.smtengo.com/` to Unit 3A.

## Method 1: Using the Admin API Endpoint

Call the admin API endpoint with the provided token:

```bash
curl -X POST https://your-domain.vercel.app/api/admin/link-ha-unit3a \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "baseUrl": "https://demoha.smtengo.com",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI2NTlhZmI3NDM0MjI0NjZlYjUxNzk0NWFlNDQzZGM5MiIsImlhdCI6MTc2NTI1MzAyMywiZXhwIjoyMDgwNjEzMDIzfQ.FmmTfynLVfAcVrIan0bwfbIpCKITfPYnIZgYdykb0bs"
  }'
```

**Note:** You need to be logged in as an admin user for this to work.

## Method 2: Using the UI

1. Navigate to the Home Assistant panel in the app
2. Click the "配網" (Provision) button
3. Enter:
   - **Base URL**: `https://demoha.smtengo.com`
   - **Access Token**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI2NTlhZmI3NDM0MjI0NjZlYjUxNzk0NWFlNDQzZGM5MiIsImlhdCI6MTc2NTI1MzAyMywiZXhwIjoyMDgwNjEzMDIzfQ.FmmTfynLVfAcVrIan0bwfbIpCKITfPYnIZgYdykb0bs`
4. Click "Submit"

## Method 3: Direct Database Update (Advanced)

If you have direct database access, you can update the `home_assistant_configs` table directly:

```sql
-- First, find the Unit 3A household ID
SELECT id, name, apartment_no FROM households 
WHERE name ILIKE '%3A%' OR apartment_no = '3A';

-- Then insert or update the config
INSERT INTO home_assistant_configs (household_id, base_url, access_token, server_ip, created_at, updated_at)
VALUES (
  'household-id-from-above',
  'https://demoha.smtengo.com',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI2NTlhZmI3NDM0MjI0NjZlYjUxNzk0NWFlNDQzZGM5MiIsImlhdCI6MTc2NTI1MzAyMywiZXhwIjoyMDgwNjEzMDIzfQ.FmmTfynLVfAcVrIan0bwfbIpCKITfPYnIZgYdykb0bs',
  'demoha.smtengo.com',
  NOW(),
  NOW()
)
ON CONFLICT (household_id) DO UPDATE
SET 
  base_url = EXCLUDED.base_url,
  access_token = EXCLUDED.access_token,
  server_ip = EXCLUDED.server_ip,
  updated_at = NOW();
```

## Verification

After linking, you should see:
1. Connection status indicator showing green (online)
2. All entities grouped by device (e.g., "米多力除溼機" with all its entities)
3. Ability to control all entities

## Features Added

- **Connection Status**: Real-time connection status indicator (green/yellow/red)
- **Device Grouping**: Entities are automatically grouped by device
- **Device Information**: Shows device name, manufacturer, and model when available
- **Entity Count**: Shows number of entities per device

