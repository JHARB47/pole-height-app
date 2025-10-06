# RUNTIME ERROR FIX GUIDE
## Error: "TypeError: Right side of assignment cannot be destructured"

## 🔍 What's Happening

This error occurs when JavaScript tries to destructure `undefined` or `null` as if it were an object. Most likely causes:

1. **Corrupt localStorage data** - The Zustand store is trying to restore corrupted state
2. **Missing store initialization** - A component is trying to access store data before it's ready
3. **Browser cache** - Old JavaScript code with different data structures

## ✅ Quick Fix (Try these in order)

### Fix 1: Clear Browser Storage (Most Likely Solution)

**Option A: Via Browser DevTools**
1. Open your browser
2. Go to https://poleplanpro.com (or localhost:5173)
3. Open DevTools (F12 or Cmd+Option+I on Mac)
4. Go to **Console** tab
5. Paste this command and press Enter:
   ```javascript
   localStorage.clear(); sessionStorage.clear(); location.reload();
   ```

**Option B: Via Browser Settings**
1. Open browser settings
2. Search for "Clear browsing data"
3. Select **Cached images and files** and **Cookies and site data**
4. Time range: **Last 24 hours**
5. Click **Clear data**
6. Reload the page

**Option C: Use Incognito/Private Window**
1. Open an Incognito/Private window
2. Visit https://poleplanpro.com
3. If it works, the issue is definitely browser cache/storage

### Fix 2: Hard Refresh

**Mac:**
- Chrome/Edge: `Cmd + Shift + R`
- Safari: `Cmd + Option + R`

**Windows/Linux:**
- Chrome/Edge/Firefox: `Ctrl + Shift + R`
- `Ctrl + F5`

### Fix 3: Clear Service Worker

1. Open DevTools (F12)
2. Go to **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
3. Click **Service Workers** in the left sidebar
4. Click **Unregister** next to the service worker
5. Reload the page

### Fix 4: Check Browser Console for Details

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for the full error stack trace
4. Take a screenshot and check which file/line is causing the issue

## 🔧 For Developers: Manual Fix

If you're running the app locally, you can manually fix corrupt store data:

### Check for Corrupt Store Data

```bash
# Open DevTools Console and run:
JSON.parse(localStorage.getItem('pole-height-store'))
```

If this throws an error, the store is corrupt.

### Fix Corrupt Store

```javascript
// In DevTools Console:
try {
  const raw = localStorage.getItem('pole-height-store');
  const parsed = JSON.parse(raw);
  console.log('Store is valid:', parsed);
} catch (error) {
  console.error('Store is corrupt:', error);
  localStorage.removeItem('pole-height-store');
  console.log('✅ Corrupt store removed. Reload the page.');
  location.reload();
}
```

### Rebuild Application (Local Development)

```bash
# Stop dev server (Ctrl+C)
# Clear node cache
rm -rf node_modules/.vite

# Rebuild
npm run build

# Start dev server
npm run dev
```

## 🐛 Common Destructuring Error Sources

### 1. Store Hook Usage
**Bad:**
```javascript
const { someValue } = useAppStore(); // ❌ Returns undefined if store not ready
```

**Good:**
```javascript
const someValue = useAppStore(state => state.someValue) || defaultValue; // ✅ Safe with fallback
```

### 2. Props Destructuring
**Bad:**
```javascript
const { data } = props; // ❌ If props is undefined
```

**Good:**
```javascript
const { data } = props || {}; // ✅ Safe with fallback
```

### 3. API Response Destructuring
**Bad:**
```javascript
const { results } = await fetchData(); // ❌ If fetchData returns undefined
```

**Good:**
```javascript
const response = await fetchData();
const { results = [] } = response || {}; // ✅ Safe with defaults
```

## 📊 Verification Steps

After applying a fix:

1. ✅ **Check Console** - No errors in DevTools Console
2. ✅ **Test Navigation** - Can navigate between pages
3. ✅ **Test Forms** - Can enter data in Job Setup and Calculator
4. ✅ **Test Export** - Can export to PDF/CSV
5. ✅ **Check Network** - No failed requests in Network tab

## 🚨 If Still Broken

If none of the above fixes work, the issue might be in a specific component. Check these files:

1. `src/utils/store.js` (lines 1-20) - Store initialization
2. `src/App.jsx` - Main app component
3. `src/components/JobSetup.jsx` - Job configuration
4. `src/components/ProposedLineCalculator.jsx` - Main calculator
5. `src/utils/geodata.js` (line 77) - GeoJSON building

### Get Full Error Details

1. Open browser to the error page
2. Open DevTools Console
3. Look for the **full error stack trace**
4. Share the error message showing:
   - File name
   - Line number
   - Full error text

Example error format to look for:
```
TypeError: Right side of assignment cannot be destructured
    at ProposedLineCalculator.jsx:276
    at buildGeoJSON (geodata.js:77)
    at useEffect (react-dom.production.min.js:1234)
```

## 💡 Prevention Tips

To avoid this error in the future:

1. **Always use fallbacks for destructuring:**
   ```javascript
   const { value } = object || {};
   const { data = [] } = response || {};
   ```

2. **Clear cache after major updates:**
   - Hard refresh after deployment
   - Clear localStorage after schema changes

3. **Test in Incognito mode:**
   - Ensures clean environment
   - No cache or storage interference

4. **Monitor browser console:**
   - Check for warnings before they become errors
   - Keep DevTools open during development

## 📞 Need More Help?

If you're still experiencing issues:

1. Clear ALL browser data (not just cache)
2. Try a different browser
3. Check if production site works: https://poleplanpro.com
4. If local development only, try: `rm -rf node_modules && npm install`

---

**Last Updated:** October 5, 2025  
**Related Docs:** 
- CLEAR-CACHE-INSTRUCTIONS.md (Browser cache clearing)
- PRODUCTION-ERROR-FIX-SUMMARY.md (React error resolution)
- APP-ARCHITECTURE.md (Application structure)
