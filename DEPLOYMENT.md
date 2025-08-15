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
   - Node.js version: 18+

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

**Issue**: proj4 globalThis errors  
**Solution**: External handling configured in rollup options

**Issue**: Large bundle warnings
**Solution**: Code splitting configured, warnings adjusted to 600KB limit

### Runtime Issues

**Issue**: Blank page after deployment
**Solution**: Check browser console for errors, verify all chunks loaded

**Issue**: File import not working
**Solution**: Verify CSP headers allow blob: and data: URLs

**Issue**: State not persisting
**Solution**: Check localStorage is enabled and working

### Netlify-Specific Issues

**Issue**: 404 on page refresh
**Solution**: SPA redirect rules in netlify.toml handle this

**Issue**: Security headers blocking features
**Solution**: CSP configured to allow necessary scripts and data

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
