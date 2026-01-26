# Production Deployment Checklist - v0.2.0

**Status:** 🟡 IN PROGRESS  
**Target:** PolePlan Pro v0.2.0  
**Date:** 2026-01-26

---

## A) Release Hygiene ✅

### 1. Version Tag
- [x] Current version: `0.2.0` (confirmed in package.json)
- [ ] **ACTION REQUIRED:** Create git tag `v0.2.0`
  ```bash
  git tag -a v0.2.0 -m "Release v0.2.0 - Enhanced Store Actions + E2E Coverage"
  git push origin v0.2.0
  ```

### 2. Release Notes
- [x] Source document: `DEPLOYMENT-GATE-FINAL.md`
- [ ] **ACTION REQUIRED:** Create GitHub Release with notes below

---

## B) Security + Dependency Audit 🔴 **CRITICAL ISSUES FOUND**

### Audit Results
```
4 high severity vulnerabilities detected:

1. @remix-run/router <=1.23.1 - React Router XSS vulnerability
   - Affected: react-router-dom 6.4.0-pre.0 - 6.30.2
   - Fix: Available via npm audit fix
   - Impact: HIGH - XSS via open redirects

2. qs <6.14.1 - DoS via memory exhaustion
   - Fix: Available via npm audit fix
   - Impact: HIGH - arrayLimit bypass
```

### **REQUIRED ACTIONS BEFORE DEPLOY:**
- [ ] **CRITICAL:** Run `npm audit fix` to patch vulnerabilities
- [ ] Verify no breaking changes in dependencies
- [ ] Re-run full test suite after patches
- [ ] Confirm build still succeeds

**⚠️ DO NOT DEPLOY until security issues are resolved**

---

## C) Production Build Verification

### Fresh Build Test (Required on Clean Environment)
- [ ] Run on clean machine/CI runner:
  ```bash
  npm ci
  npm run build
  npm run preview
  ```

### Manual Smoke Test Checklist
- [ ] **Create Job:** Basic job creation form works
- [ ] **Import 100 poles:** CSV import completes without errors
- [ ] **Import 1000 poles:** Performance remains acceptable (<2s)
- [ ] **Edit Pole:** Inline editing saves correctly
- [ ] **Span Model:** Trigonometric calculations accurate
- [ ] **Field Collection:** GPS capture, photo attach works
- [ ] **Export CSV:** Download triggers, file structure valid
- [ ] **Export Shapefile:** CDN loads OR fallback to GeoJSON works
- [ ] **Mobile Navigation:** Hamburger menu, responsive layout functional
- [ ] **Console Clean:** No errors in browser console
- [ ] **No Stuck Spinners:** All async operations complete

### Build Artifacts Verification
- [ ] Bundle size ≤ 1200 KB (current: 940.2 KB ✅)
- [ ] Build time < 3s (current: 1.55s ✅)
- [ ] All chunks properly code-split
- [ ] Source maps generated for debugging

---

## D) Environment + Configuration

### Production Environment Variables (Netlify)
Required variables to verify in Netlify dashboard:

#### API Configuration
- [ ] `VITE_API_BASE_URL` - Production API endpoint
- [ ] `VITE_GITHUB_CLIENT_ID` - OAuth client ID
- [ ] `GITHUB_CLIENT_SECRET` - OAuth secret (server-side only)

#### Feature Flags
- [ ] `VITE_ENABLE_BATCH_OPERATIONS=true` - Enhanced store actions
- [ ] `VITE_ENABLE_FIELD_COLLECTION=true` - Enhanced field panel
- [ ] `VITE_ENABLE_OFFLINE_SYNC=true` - Offline queue functionality

#### Monitoring
- [ ] `VITE_ENABLE_ERROR_BOUNDARY=true` - Error boundary telemetry
- [ ] `VITE_ENABLE_HEALTH_MONITOR=true` - Health endpoint visibility
- [ ] `SENTRY_DSN` - Error tracking (if using Sentry)

#### Database
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `DATABASE_POOL_MIN=2`
- [ ] `DATABASE_POOL_MAX=10`

#### Security
- [ ] `JWT_SECRET` - Session signing key (server-side only)
- [ ] `SESSION_SECRET` - Session encryption

### Configuration Sanity Checks
- [ ] No secrets in localStorage (check client-side code)
- [ ] CORS configured for production domain
- [ ] CSP headers allow required CDN resources
- [ ] Redirect rules configured in `netlify.toml`

---

## E) Observability / Early Warning System

### Health Monitoring Endpoints
- [ ] **Verify accessible in production:**
  - `GET /api/health` - Basic health check
  - `GET /api/diagnostics/system` - System metrics
  - `GET /api/diagnostics/database` - DB connection status
  - `GET /api/diagnostics/performance` - Performance stats

### Error Tracking
- [ ] ErrorBoundary component visible and returns diagnostic info
- [ ] Error monitor logging at warn/error level minimum
- [ ] Correlation IDs included in logs (jobId, sessionId)

### Performance Baselines
Document current baselines for comparison:
- Import 100 poles: **1.41ms** (target <50ms)
- Import 1000 poles: **1.80ms** (target <450ms)
- Export 1000 poles: **0.28ms** (target <500ms)
- Memory usage (1000 poles): **1.82MB** (target <10MB)

---

## F) Rollback Plan 🔴 **NON-OPTIONAL**

### Pre-Deploy Verification
- [ ] Last known-good release tag exists: **[DOCUMENT TAG]**
- [ ] Rollback procedure documented below
- [ ] Rollback tested at least once

### Rollback Procedure
```bash
# 1. Identify last stable release
git tag -l --sort=-version:refname | head -5

# 2. Revert to previous tag (example: v0.1.9)
git checkout v0.1.9

# 3. Force deploy to production
git push origin v0.1.9:main --force

# 4. Trigger Netlify redeploy
# Via Netlify UI: Deploys → Trigger deploy → Deploy site

# 5. Verify rollback successful
curl https://poleplan.pro/api/health
```

### Database Migration Strategy
- [ ] **No DB migrations in this release** ✅
- [ ] If migrations exist: Forward-only strategy confirmed
- [ ] If migrations exist: Rollback SQL scripts prepared

### Critical Files Inventory (for rollback)
- `src/utils/store.js` - Enhanced actions integration
- `src/utils/enhancedStoreActions.js` - New batch operations
- `src/components/workflow/panels/EnhancedFieldCollectionPanel.jsx` - New UI
- `package.json` - Dependency updates (if security patches applied)

---

## Post-Deploy Verification (First 30-60 Minutes)

### Automated Testing
- [ ] Run Playwright suite against production:
  ```bash
  npx playwright test --config=playwright.config.js --project=chromium-desktop
  ```
- [ ] Verify all 8 E2E tests pass in production environment

### Performance Verification
- [ ] Import 100 poles (3 runs) - avg time: **[RECORD]**
- [ ] Import 1000 poles (2 runs) - avg time: **[RECORD]**
- [ ] Export CSV (1000 poles) - download time: **[RECORD]**

### Log Analysis (First Hour)
Monitor for:
- [ ] `validationFailed` spike (acceptable: <1% of imports)
- [ ] `offlineQueueSyncFailure` (acceptable: <5% if offline enabled)
- [ ] `exportFailure` (acceptable: 0%)
- [ ] Unexpected 4xx errors (acceptable: <1%)
- [ ] 5xx errors (acceptable: 0%)

### Health Metrics
- [ ] Error rate: **[RECORD]** (target: <0.1%)
- [ ] Response time p95: **[RECORD]** (target: <500ms)
- [ ] Memory usage: **[RECORD]** (target: stable, no leaks)

---

## Known Issues (From TEST-QUARANTINE.md)

### Non-Blocking Test Failures (Quarantined)
1. **shapefileFallback.test.js**
   - Issue: CDN script loading simulation unreliable in jsdom
   - Impact: LOW - Covered by manual testing and E2E
   - Mitigation: Playwright network interception test planned
   - Owner: [ASSIGN]
   - Deadline: [SET DATE]

2. **criticalFixes.test.js**
   - Issue: Dynamic import caching prevents test isolation
   - Impact: LOW - Functionality verified manually
   - Mitigation: Test restructuring with proper module cache cleanup
   - Owner: [ASSIGN]
   - Deadline: [SET DATE]

**Ship Decision:** ✅ Acceptable - Neither masks core workflow risk

---

## Final Go/No-Go Decision

### Blocking Issues (Must be ZERO)
- [ ] Security vulnerabilities: **🔴 4 HIGH** - MUST FIX BEFORE DEPLOY
- [ ] Build failures: **0** ✅
- [ ] Critical test failures: **0** ✅
- [ ] Performance regressions: **0** ✅

### Final Checklist
- [ ] All security patches applied
- [ ] Full test suite passing after patches
- [ ] Fresh build verified on clean environment
- [ ] Environment variables configured
- [ ] Health endpoints verified
- [ ] Rollback plan tested
- [ ] Release notes prepared
- [ ] Team notified of deployment window

### Sign-off
- [ ] **Engineering Lead:** ___________________ Date: _______
- [ ] **QA Lead:** ___________________ Date: _______
- [ ] **DevOps:** ___________________ Date: _______

---

## Deployment Commands (When All Checks Pass)

```bash
# 1. Apply security patches
npm audit fix
npm test -- --run
npm run build

# 2. Commit patches
git add package*.json
git commit -m "security: patch high severity vulnerabilities (react-router, qs)"

# 3. Tag release
git tag -a v0.2.0 -m "Release v0.2.0 - Enhanced Store Actions + E2E Coverage"

# 4. Push to production
git push origin main
git push origin v0.2.0

# 5. Netlify auto-deploys from main branch
# Monitor: https://app.netlify.com/sites/[your-site]/deploys

# 6. Verify deployment
curl https://poleplan.pro/api/health
```

---

**Controlled Burn Principles:**
1. Ship ✅
2. Watch 👀
3. Verify ✓
4. Keep rollback ready 🔙
