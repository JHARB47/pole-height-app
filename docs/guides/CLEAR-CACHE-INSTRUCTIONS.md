# How to Clear Browser Cache for PolePlan Pro

## The Problem
Your browser and service worker are caching the old broken JavaScript files. Even though the fix is deployed, you're still loading old code from cache.

## Quick Fix: Hard Refresh

### Mac
```
Cmd + Shift + R
```

### Windows/Linux
```
Ctrl + Shift + F5
```

## If That Doesn't Work: Clear Service Worker

### Chrome/Edge
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. Click **Unregister** next to the poleplanpro.com service worker
5. Click **Clear site data** button at top
6. Close DevTools
7. Hard refresh again (Cmd+Shift+R)

### Firefox
1. Open DevTools (F12)
2. Go to **Application** tab (or Storage tab)
3. Click **Service Workers** in left sidebar
4. Click **Unregister** next to the poleplanpro.com service worker
5. Right-click the page → **Inspect**
6. Go to **Storage** tab
7. Right-click **https://poleplanpro.com** → **Delete All**
8. Hard refresh (Cmd+Shift+R)

### Safari
1. Open DevTools (Cmd+Option+I)
2. Go to **Storage** tab
3. Click **Service Workers** in left sidebar
4. Select the poleplanpro.com worker
5. Click **Unregister**
6. Go to Safari menu → **Clear History...**
7. Select "all history"
8. Click **Clear History**
9. Hard refresh (Cmd+Shift+R)

## Nuclear Option: Incognito/Private Window

If nothing else works:
1. Open an **Incognito/Private window**
2. Visit https://poleplanpro.com
3. The site will work correctly (no cache)
4. Then go back to normal window and clear cache properly

## Verify It's Fixed

After clearing cache, open DevTools console (F12 → Console tab) and you should see:
- ✅ No "Cannot set properties of undefined" error
- ✅ No React errors
- ✅ App loads and displays correctly

## What Was Fixed

The production deployment now has:
- **Commit:** c5c9214
- **Build:** index-CjPPD6UQ.js (new hash)
- **Status:** ✅ LIVE on Netlify (deployed 10 seconds ago)
- **Issue:** Removed duplicate ErrorBoundary that was breaking React

## Why This Happened

When the site had the React error earlier:
1. Your browser downloaded the broken JavaScript
2. Service Worker cached it for offline use
3. Even after we fixed and deployed, your browser kept serving the old cached version
4. This is normal PWA behavior—it's designed to work offline

## Prevention

After major fixes like this:
1. Always hard refresh (Cmd+Shift+R)
2. Check the network tab shows new file hashes
3. Verify service worker updated (Application → Service Workers → shows "activated and running")

---

**Current Status:** ✅ Fix is deployed and live  
**Your Browser:** Still loading old cached version  
**Solution:** Hard refresh (Cmd+Shift+R) or clear service worker
