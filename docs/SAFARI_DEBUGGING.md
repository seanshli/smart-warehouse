# Safari Cookie Debugging Guide (Mac)

## How to Check Cookies in Safari on Mac

### Method 1: Safari Developer Tools (Recommended)

1. **Enable Developer Menu**:
   - Open Safari
   - Go to **Safari** → **Settings** (or **Preferences**)
   - Click **Advanced** tab
   - Check **"Show features for web developers"** (or **"Show Develop menu in menu bar"**)

2. **Open Developer Tools**:
   - Press `Cmd + Option + I` (or go to **Develop** → **Show Web Inspector**)
   - Click the **Storage** tab (or **Resources** tab in older Safari)

3. **View Cookies**:
   - In the left sidebar, expand **Cookies**
   - Click on your domain (e.g., `smart-warehouse-five.vercel.app`)
   - Look for `catering_cart` cookie
   - Check:
     - **Name**: `catering_cart`
     - **Value**: Should contain JSON with cart items
     - **Domain**: Should match your domain
     - **Path**: Should be `/`
     - **Expires**: Should be 7 days from now
     - **HttpOnly**: Should be checked
     - **Secure**: Should match your environment (checked in production)
     - **SameSite**: Should be `Lax`

### Method 2: Safari Console Logs

1. **Open Console**:
   - Press `Cmd + Option + C` (or **Develop** → **Show JavaScript Console**)

2. **Check Console Logs**:
   - Look for logs starting with `[Cart API]` or `[CateringCart]`
   - Check for:
     - `[Cart API] Cookie set on response`
     - `[Cart API GET] Cookie exists in list: true/false`
     - `[CateringCart] Loaded cart data:`
     - `[CateringCart] Cart items count:`

### Method 3: Network Tab

1. **Open Network Inspector**:
   - Press `Cmd + Option + I`
   - Click **Network** tab

2. **Check Requests**:
   - Add an item to cart
   - Find the `POST /api/catering/cart` request
   - Check **Response Headers** for `Set-Cookie: catering_cart=...`
   - Find the `GET /api/catering/cart` request
   - Check **Request Headers** for `Cookie: catering_cart=...`

### Method 4: Safari Settings Check

1. **Check Cookie Settings**:
   - Go to **Safari** → **Settings** → **Privacy**
   - Check **"Prevent cross-site tracking"** - This might block cookies
   - Try disabling it temporarily to test
   - Check **"Block all cookies"** - Should be OFF

2. **Check Private Browsing**:
   - Make sure you're NOT in Private Browsing mode
   - Private Browsing clears cookies when tab closes

## Common Safari Cookie Issues

### Issue 1: SameSite Cookie Restrictions
- Safari has strict SameSite cookie policies
- Solution: Use `SameSite=Lax` (already implemented)

### Issue 2: ITP (Intelligent Tracking Prevention)
- Safari's ITP might block cookies from third-party domains
- Solution: Ensure cookies are first-party (same domain)

### Issue 3: Secure Cookie Requirement
- In production, cookies with `SameSite=None` require `Secure=true`
- Solution: We use `SameSite=Lax` which doesn't require Secure in development

### Issue 4: Cookie Size Limit
- Safari has a 4KB cookie size limit per domain
- If cart has many items, cookie might be too large
- Check cookie value size in Developer Tools

## Debugging Steps

1. **Clear All Cookies**:
   - Safari → Settings → Privacy → Manage Website Data
   - Search for your domain
   - Click "Remove All" or remove specific cookies

2. **Test in Incognito/Private Window**:
   - Open a new Private Window
   - Test adding items to cart
   - This isolates cookie issues

3. **Check Console Errors**:
   - Look for cookie-related errors
   - Check for CORS errors
   - Check for network errors

4. **Verify Cookie is Set**:
   - After adding item, check Developer Tools → Storage → Cookies
   - Cookie should appear immediately after POST request

5. **Verify Cookie is Read**:
   - When loading cart page, check GET request headers
   - Cookie should be in `Cookie:` header

## Expected Behavior

1. **After Adding Item**:
   - POST `/api/catering/cart` → Response includes `Set-Cookie: catering_cart=...`
   - Console shows: `[Cart API] Cookie set on response`
   - Cookie appears in Storage → Cookies

2. **When Loading Cart**:
   - GET `/api/catering/cart` → Request includes `Cookie: catering_cart=...`
   - Console shows: `[Cart API GET] Cookie exists in list: true`
   - Console shows: `[CateringCart] Loaded cart data: {items: [...], total: ...}`

3. **If Cookie Missing**:
   - Console shows: `[Cart API GET] No cart cookie found`
   - Cookie doesn't appear in Storage → Cookies
   - Check Safari Privacy settings

## Quick Test Script

Open Safari Console and run:

```javascript
// Check if cookie exists
document.cookie.split(';').find(c => c.trim().startsWith('catering_cart'))

// Note: This won't show httpOnly cookies, but you can check in Developer Tools
```

## If Still Not Working

1. Check Safari version (should be Safari 14+)
2. Try disabling all Safari extensions
3. Try a different browser (Chrome/Firefox) to isolate Safari-specific issues
4. Check if you're behind a proxy/VPN that might interfere
5. Check Safari → Develop → User Agent - make sure it's not spoofed
