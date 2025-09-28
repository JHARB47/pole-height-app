# Netlify Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Build Process

- [x] `npm run build` completes successfully
- [x] Code splitting optimized (geospatial ~300KB, vendor ~144KB, main ~84KB)
- [x] All tests pass (`npm test`)
- [x] No linting errors (`npm run lint`)
- [x] Production preview works (`npm run preview`)

### 2. Configuration Files

- [x] `netlify.toml` in root directory with correct settings
- [x] `vite.config.js` optimized for production build
- [x] `package.json` has correct build scripts
- [x] `.env.example` documents environment variables

### 3. Application Features

- [x] All calculation features working
- [x] Geospatial import (KML/KMZ/Shapefile) functional
- [x] Format preferences (verbose/tick mark) working
- [x] Help system accessible and complete
- [x] CSV export working
- [x] State persistence functional

## 🚀 Netlify Deployment Steps

### Option A: Automatic Deployment (Recommended)

1. **Connect Repository**
   - Link GitHub repository to Netlify
   - Netlify auto-detects build settings from `netlify.toml`

2. **Verify Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node.js version: 22

3. **Deploy**
   - Netlify will automatically build and deploy
   - Check deployment logs for any issues

### Option B: Manual Deployment

1. **Build Locally**

   ```bash
   npm run build
   ```

2. **Deploy dist folder**
   - Use Netlify CLI or drag-and-drop
   - Upload entire `dist` folder contents

## 🔧 Post-Deployment Verification

### 1. Basic Functionality

- [ ] Application loads without errors
- [ ] All pages/components render correctly
- [ ] Navigation works properly
- [ ] No JavaScript console errors

### 2. Feature Testing

- [ ] Input forms accept data correctly
- [ ] Calculations produce expected results
- [ ] File import works (test with sample KML/Shapefile)
- [ ] CSV export downloads properly
- [ ] Help modal opens and displays content
- [ ] Format preferences save and apply

### 3. Performance

- [ ] Initial page load < 3 seconds
- [ ] Geospatial features load acceptably
- [ ] No memory leaks in browser dev tools
- [ ] Mobile responsiveness working

### 4. Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## 🐛 Common Issues & Solutions

### Build Failures

**Issue**: Buffer polyfill errors
**Solution**: vite.config.js includes buffer polyfill configuration

**Issue**: (Historical) proj4 globalThis errors  
**Resolution**: Eliminated by removing build-time Shapefile bundling; shapefile export now loads `@mapbox/shp-write` from a CDN at runtime (no `proj4` in bundle).

**Issue**: Large bundle warnings
**Solution**: Code splitting configured, warnings adjusted to 600KB limit

### Runtime Issues

**Issue**: Blank page after deployment
**Solution**: Check browser console for errors, verify all chunks loaded

**Issue**: File import not working
**Solution**: Verify CSP headers allow `blob:` and `data:` URLs; ensure offline mode still has fallback (GeoJSON) for shapefile export if CDN blocked.

**Issue**: State not persisting
**Solution**: Check localStorage is enabled and working

### Netlify-Specific Issues

**Issue**: 404 on page refresh
**Solution**: SPA redirect rules in netlify.toml handle this

**Issue**: Security headers blocking features
**Solution**: CSP configured to allow necessary scripts and data

**Issue**: Build fails with "Plugin \"@netlify/plugin-nextjs\" failed … does not contain a Next.js production build"
**Cause**: The Netlify Next.js plugin is enabled for a Vite SPA. It expects a `.next` build that doesn’t exist.
**Fix**:

1. In Netlify → Site settings → Build & deploy → Environment, add `NETLIFY_NEXT_PLUGIN_SKIP=true` (applies to all contexts).
2. In Netlify → Site settings → Plugins, uninstall `@netlify/plugin-nextjs` from the site.
3. Confirm repo `netlify.toml` has `publish = "dist"` and build command runs Vite. In this repo, the build command also exports the skip flag inline.
4. Re-deploy.

## 📊 Monitoring & Maintenance

### Performance Monitoring

- Monitor Netlify analytics for usage patterns
- Check Core Web Vitals in Google Search Console
- Monitor bundle sizes with each deployment

### Updates

- Keep dependencies updated regularly
- Test thoroughly after dependency updates
- Monitor for security vulnerabilities

### User Support

- Monitor for user-reported issues
- Collect feedback on calculation accuracy
- Document common user questions

## 🔄 Rollback Plan

If deployment issues occur:

1. **Immediate Rollback**
   - Use Netlify's rollback feature to previous working version
   - Notify users of temporary issues if needed

2. **Investigation**
   - Check deployment logs
   - Test locally with production build
   - Identify specific issue

3. **Fix & Redeploy**
   - Make necessary fixes
   - Test thoroughly
   - Deploy new version

## 📝 Environment Variables

For production deployment, consider setting:

```bash
VITE_APP_NAME="Pole Height Calculator"
VITE_APP_VERSION="1.0.0"
VITE_BUILD_TARGET="production"
VITE_DEBUG_MODE="false"
```

## 🎯 Success Criteria

Deployment is successful when:

- [ ] All automated tests pass
- [ ] Application loads in under 3 seconds
- [ ] All major features work correctly
- [ ] No console errors in production
- [ ] Mobile responsive design works
- [ ] File import/export functions properly
- [ ] Help system is accessible and useful

## 🧩 Shapefile Export Strategy

The production build omits `@mapbox/shp-write` and related heavy GIS dependencies to avoid historical bundling issues (notably the `proj4` globalThis import path). When a user requests a Shapefile export:

1. A script tag is injected pointing to the UMD build on a public CDN.
2. If the script loads, a ZIP containing the Shapefile components plus GeoJSON is produced.
3. If the script fails (offline, blocked, CSP), the app gracefully falls back to providing a ZIP with the GeoJSON only (user is notified).

Operational Notes:

- No offline caching of the CDN script is currently performed; consider adding a service-worker prefetch if offline shapefile generation becomes a requirement.
- Fallback ensures workflows are never entirely blocked by network policies.

## ✨ Visual Editor / Netlify Create Readiness

The repository is prepared for Netlify Create (Visual Editor) integration:

- Content Source: JSON files under `content/pages/*.json`.
- `stackbit.config.ts`: Defines the Page model and Git content source mapping slugs to URLs.

Enable Steps:

1. In Netlify, enable the Visual Editor (Create) for the connected site.
2. Confirm the content directory: `content/pages`.
3. Regenerate preview; verify pages appear in the editor with editable title/slug fields.
4. Commit changes through the Visual Editor; confirm Netlify build triggers.

Best Practices:

- Keep content schema changes synchronized with `stackbit.config.ts`.
- Add validation scripts if adding new models.
- If adding rich text in future, extend the model with a `body` field and update the renderer component.
