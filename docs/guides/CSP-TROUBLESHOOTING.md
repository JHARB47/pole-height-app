# Content Security Policy (CSP) Troubleshooting Guide

## Overview

This document explains the Content Security Policy errors you may encounter and how to resolve them.

## Common CSP Errors

### 1. cdn.aitopia.ai Image Loading Errors

**Error Message:**

```
Refused to load the image 'https://cdn.aitopia.ai/storages/0/ai_logo/svg/logo.svg'
because it violates the following Content Security Policy directive: "img-src 'self' data: blob: ..."
```

**Root Cause:**
These errors are **NOT from your production code**. They originate from:

- **Browser Extensions**: AI assistants, productivity tools, or developer extensions
- **Testing Tools**: Google Lighthouse, PageSpeed Insights, or other automated testing tools
- **Third-party Scripts**: Injected by browser plugins or monitoring services

**Evidence:**

- Stack traces show `_lighthouse-eval.js` - this is Google Lighthouse's evaluation script
- Your `index.html` contains NO references to `cdn.aitopia.ai`
- Your source code doesn't load external images from this domain

**Resolution:**
✅ **These errors are SAFE TO IGNORE** - they don't affect your production users.

**Optional Actions:**

1. **Disable browser extensions** during development to reduce noise
2. **Use Incognito/Private browsing** for cleaner console output
3. **Filter console errors** by excluding `cdn.aitopia.ai`

### 2. OpenStreetMap Tile Loading

**Fixed in v0.2.0:**
We've updated the CSP policy to allow OpenStreetMap tile servers for map functionality:

```
img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org
```

This allows the app to load map tiles when displaying geospatial data.

## Current CSP Policy (v0.2.0)

### Production Pages (/)

```
default-src 'self';
script-src 'self' https://unpkg.com https://cdn.jsdelivr.net blob:;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org;
font-src 'self' data:;
connect-src 'self' https:;
worker-src 'self' blob:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self'
```

**What's Allowed:**

- ✅ Images from your domain (`'self'`)
- ✅ Data URIs (`data:`)
- ✅ Blob URLs (`blob:`)
- ✅ OpenStreetMap tiles
- ✅ Scripts from unpkg.com and cdn.jsdelivr.net (for shapefile export)
- ✅ Inline styles (for component styling)
- ✅ HTTPS connections for API calls

**What's Blocked:**

- ❌ External image CDNs (except OpenStreetMap)
- ❌ Inline scripts (security hardening)
- ❌ eval() in JavaScript
- ❌ Embedding in iframes
- ❌ Third-party domains not explicitly allowed

## How to Add New Domains

If you need to add a legitimate external resource:

1. **Edit `public/_headers`** - for static Netlify deploys
2. **Edit `netlify.toml`** - for Netlify configuration
3. **Update the directive** based on resource type:
   - Images: Add to `img-src`
   - Scripts: Add to `script-src`
   - APIs: Add to `connect-src`
   - Fonts: Add to `font-src`

**Example - Adding Mapbox:**

```
img-src 'self' data: blob: https://api.mapbox.com https://*.mapbox.com;
```

## Security Best Practices

### ✅ DO:

- Keep CSP as restrictive as possible
- Only allow domains you actually use
- Use `'self'` and specific domains instead of wildcards
- Regularly audit your CSP policy
- Test CSP changes in staging before production

### ❌ DON'T:

- Don't use `'unsafe-inline'` for scripts in production
- Don't use `'unsafe-eval'` unless absolutely necessary
- Don't use `*` wildcards for script/img sources
- Don't whitelist domains "just to fix console errors" without investigation

## Version History

### v0.2.0 (2025-10-04)

- ✅ Added OpenStreetMap tile server support to `img-src`
- ✅ Updated all CSP policies in `_headers` file
- ✅ Documented cdn.aitopia.ai errors as false positives from browser extensions

---

**Last Updated:** October 4, 2025  
**Maintained By:** PolePlan Pro Development Team
