# Build Process Fix - Preventing Old Static Code Issues

## Problem Identified

The iOS/Android apps were loading **OLD static code from November 21st** because:
1. The `out/` directory contained files from Nov 21
2. Build scripts did NOT clean old files before building
3. Capacitor was copying old files to native apps
4. Changes to code weren't affecting apps because they loaded cached static files

## Root Cause

**Next.js with `output: 'standalone'` does NOT create an `out/` directory!**

- Standalone mode creates `.next/standalone/` directory
- But `capacitor.config.ts` has `webDir: 'out'`
- This mismatch means Capacitor was loading old files from `out/` that were never updated

## Solution Implemented

### 1. Build Script Cleanup
All build scripts now **clean old files FIRST** before building:
- `scripts/build-for-capacitor.js` - Removes `out/` and `.next/` before building
- `package.json` build scripts - Clean before building
- `scripts/build-production-mobile.sh` - Cleans before building
- `scripts/build-all-platforms.sh` - Cleans before building

### 2. Build Verification
- Verifies `out/index.html` exists after build
- Logs build timestamp for verification
- Fails build if output directory not created

### 3. Critical Next Steps

**IMPORTANT:** The `out/` directory issue needs to be resolved:

**Option A: Use Standalone Mode (Recommended)**
- Change `capacitor.config.ts` to use `.next/standalone` instead of `out/`
- OR copy `.next/standalone` to `out/` after build

**Option B: Use Static Export**
- Change `next.config.js` to use `output: 'export'` instead of `standalone`
- This will create `out/` directory properly

**Option C: Copy Standalone to Out**
- After build, copy `.next/standalone` contents to `out/`
- This ensures Capacitor gets fresh files

## Current Status

✅ Build scripts now clean old files
✅ Build verification added
⚠️ **Still need to fix `out/` vs `.next/standalone` mismatch**

## Action Required

1. **Rebuild the app** with the new cleanup scripts:
   ```bash
   npm run build:production
   ```

2. **Verify** that `out/` directory is updated (check timestamps)

3. **Sync to Capacitor**:
   ```bash
   npx cap sync
   ```

4. **Rebuild native apps** in Xcode/Android Studio

## Prevention

- Always run `npm run build:production` (not just `npm run build`)
- Check `out/index.html` timestamp after build
- Verify Capacitor sync copies fresh files
- Increment build numbers after each change
