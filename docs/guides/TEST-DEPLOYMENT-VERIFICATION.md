# Test & Deployment Verification Checklist

Use this checklist to verify the application before and after deployment.

## Pre-Deployment Verification

### 1. Code Quality
- [ ] All tests passing: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No security vulnerabilities: `npm audit`

### 2. Test Coverage
- [ ] 210+ tests passing (93.8%+ coverage)
- [ ] No unintended test failures
- [ ] Skipped tests documented (14 expected)

### 3. Functionality Checks
- [ ] App loads without errors: `npm run dev`
- [ ] Calculator renders and functions
- [ ] Import/export features work
- [ ] Geospatial export functional

### 4. Build Verification
- [ ] Bundle size within limits (check `dist/` after build)
- [ ] All chunks present
- [ ] No console errors in production build

## Deployment Steps

### 1. Netlify Deployment
```bash
# Ensure clean state
git status

# Run full verification
npm run verify

# Deploy
git push origin main  # triggers Netlify build
```

### 2. Netlify Configuration
- [ ] Node version set to 22.12.0 in `netlify.toml`
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Environment variables configured

## Post-Deployment Verification

### 1. Production Site Checks
- [ ] Site loads at production URL
- [ ] No JavaScript errors in console
- [ ] No CORS issues
- [ ] Service worker registers properly

### 2. Feature Testing
- [ ] Create a new pole calculation
- [ ] Import CSV data
- [ ] Export to multiple formats
- [ ] Verify permit generation

### 3. Performance
- [ ] Lighthouse score > 90
- [ ] Page load under 3 seconds
- [ ] PWA installable

### 4. Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

## Rollback Plan

If issues detected:

```bash
# Revert deployment via Netlify UI
# Or: revert git commit and push
git revert HEAD
git push origin main
```

## Monitoring

- Check Netlify deploy logs for errors
- Monitor browser console in production
- Review Netlify Functions logs if applicable

---

*Last Updated: October 5, 2025*
