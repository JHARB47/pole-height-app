# Incident Quick-Fix Playbook

## For Humans: Common Production Issues & Fixes

### 🚨 Dependency ETARGET Error

**Symptoms**: `npm error notarget No matching version found for esbuild@^0.24.3`

**Fix Steps**:

1. `git clean -xfd && rm -rf node_modules package-lock.json`
2. Update overrides/versions in package.json, `npm i`, commit lockfile
3. Netlify → "Clear cache and deploy"

### 🔒 CI Audit Fails (Production)

**Symptoms**: High/critical vulnerability detected in production dependencies

**Fix Steps**:

1. Check `npm audit --omit=dev`
2. If it's a sub-dependency, add/adjust overrides in package.json
3. If it's tokml, confirm it's lazy/optional; consider swap to maintained fork

### 🟡 Node Version Mismatch

**Symptoms**: Build fails with Node version errors

**Fix Steps**:

1. Ensure `.nvmrc=20` and Netlify `NODE_VERSION=20`
2. Use `npm ci` (not `npm i`) everywhere
3. Clear Netlify cache and redeploy

### 📦 KML Export Failure

**Symptoms**: KML export not working, tokml errors

**Fix Steps**:

1. Verify graceful fallback to GeoJSON is working
2. Check if tokml vulnerability is blocking functionality
3. Consider migration to maintained KML library fork

### 🏗️ Build Size Exceeded

**Symptoms**: size-limit check fails, bundle too large

**Fix Steps**:

1. Run `npm run analyze` to identify large chunks
2. Review dynamic imports and code splitting
3. Adjust size limits in package.json if justified

### 🔄 Netlify Deploy Stuck

**Symptoms**: Deploy hangs or times out

**Fix Steps**:

1. Check Netlify build logs for specific errors
2. "Clear cache and deploy" in Netlify UI
3. Verify Node version and dependencies match local build

## Environment Variables Checklist

### Required in Netlify UI:

- `DATABASE_URL`: PostgreSQL connection string
- `PGSSLMODE=require` (if needed by Neon)
- All `VITE_*` variables (client-accessible)

### Optional but Recommended:

- `NODE_ENV=production` (Netlify sets this by default)
- `NPM_FLAGS=--include=dev` (already in netlify.toml)

## Weekly Maintenance

### Automated (via CI schedule):

- `npm run knip` - Find unused exports
- `npm run depcheck` - Find unused dependencies
- `npm run size` - Check bundle size limits

### Manual (monthly):

- Review and update held major versions
- Security audit review
- Performance testing
- Dependency updates planning

## Emergency Contacts & Resources

- **Netlify Dashboard**: [Site deploys](https://app.netlify.com/sites/poleplanpro)
- **Database**: Neon console for connection issues
- **Monitoring**: Check application health endpoints
- **Repository**: GitHub Actions for build failures

## Prevention Checklist

✅ **Before Merging**:

- CI passes (lint, test, build, audit)
- Bundle size within limits
- No new high/critical prod vulnerabilities

✅ **Before Deploying**:

- Local build works: `npm run rebuild`
- Database migrations tested if applicable
- Environment variables updated if needed

✅ **After Deploying**:

- Health check passes
- Critical user flows tested
- Performance metrics reviewed
