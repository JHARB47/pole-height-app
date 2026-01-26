# PRODUCTION READINESS TODO LIST
**Priority-Ordered Action Items**

## 🔴 HIGH PRIORITY (Before Production Deploy)

### 1. Integrate Enhanced Store Actions
**File:** `src/utils/store.js`  
**Status:** Code exists but not connected  
**Action:**
```javascript
// Add to store.js imports:
import { enhancedPoleActions, enhancedSpanActions } from './enhancedStoreActions.js';

// In the create() callback, spread enhanced actions:
const useAppStore = create(
  persist(
    (set, get) => ({
      ...enhancedPoleActions(set, get),
      ...enhancedSpanActions(set, get),
      // ... existing store code
    }),
    // ... persist config
  )
);
```
**Estimated Time:** 15 minutes  
**Risk:** Low (backward compatible)

---

### 2. Execute Performance Benchmarks
**Status:** Test file created, needs execution  
**Action:**
```bash
npm test -- src/utils/__tests__/performance.bench.test.js --reporter=verbose
```
**Expected Results:**
- 100 poles: < 50ms ✓
- 1000 poles: < 450ms ✓
- 5000 poles: < 3000ms ✓

If tests fail, investigate import bottlenecks.

**Estimated Time:** 30 minutes (including optimization if needed)  
**Risk:** Medium (may require performance tuning)

---

### 3. Fix Security Vulnerabilities
**Action:**
```bash
npm audit fix
npm audit --audit-level=high
```
**Estimated Time:** 10 minutes  
**Risk:** Low (automated fixes)

---

### 4. Add Basic E2E Test Coverage
**File:** `tests/e2e/workflow.spec.js` (create)  
**Action:** Create Playwright test for happy path:
```javascript
test('complete workflow: create job → import → export', async ({ page }) => {
  await page.goto('/');
  // Test critical path
  await page.click('[data-test="create-job"]');
  await page.fill('[data-test="job-name"]', 'Test Job');
  // ... continue workflow
});
```
**Estimated Time:** 1 hour  
**Risk:** Low

---

## 🟡 MEDIUM PRIORITY (Next Sprint)

### 5. Activate EnhancedFieldCollectionPanel
**File:** `src/components/workflow/WorkflowApp.jsx`  
**Status:** Panel exists but not in active workflow  
**Action:** Add to workflow navigation/routing

**Estimated Time:** 30 minutes  
**Risk:** Low

---

### 6. Add Error Boundary to App Root
**File:** `src/App.jsx`  
**Action:**
```javascript
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
```
**Estimated Time:** 20 minutes  
**Risk:** Low

---

### 7. Implement Structured Logging
**File:** `src/utils/logger.js` (create)  
**Action:** Add correlation IDs to job operations
```javascript
export function logOperation(jobId, operation, data) {
  const correlationId = `${jobId}-${Date.now()}`;
  console.log({
    correlationId,
    timestamp: new Date().toISOString(),
    operation,
    ...data
  });
}
```
**Estimated Time:** 45 minutes  
**Risk:** Low

---

### 8. Add Merge Conflict Tests
**File:** `src/utils/__tests__/dataOperations.merge.test.js` (create)  
**Action:** Test merge priority: Field > Manual > CSV > GIS

**Estimated Time:** 1 hour  
**Risk:** Low

---

## 🟢 LOW PRIORITY (Future Enhancements)

### 9. Refactor Large Files
**Files:**
- `ProposedLineCalculator.jsx` (6,869 lines) → split into smaller components
- `SpansEditor.jsx` (1,236 lines) → extract table logic
- `calculations.js` (1,153 lines) → group by domain

**Estimated Time:** 4-6 hours  
**Risk:** Medium (regression potential)

---

### 10. Add Performance Monitoring
**Action:** Integrate performance.mark() and performance.measure()
```javascript
performance.mark('import-start');
// ... import logic
performance.mark('import-end');
performance.measure('csv-import', 'import-start', 'import-end');
```
**Estimated Time:** 2 hours  
**Risk:** Low

---

### 11. Create Migration Guide
**File:** `docs/MIGRATION-GUIDE.md` (create)  
**Content:**
- How to adopt enhanced store actions
- Performance optimization tips
- Offline-first feature activation

**Estimated Time:** 2 hours  
**Risk:** None

---

### 12. Add Timeout Handling
**Files:** All async operations  
**Action:** Add AbortController pattern:
```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
try {
  await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```
**Estimated Time:** 3 hours  
**Risk:** Low

---

## VERIFICATION CHECKLIST

Before marking as complete, verify:

- [ ] All HIGH priority items completed
- [ ] Performance benchmarks passing
- [ ] Security audit clean (no critical/high)
- [ ] E2E tests covering critical path
- [ ] Enhanced store actions integrated OR documented as opt-in
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm run test:full`
- [ ] Lint clean: `npm run lint`
- [ ] Bundle size acceptable: < 1.5MB gzipped

---

## ESTIMATED TOTAL TIME

- **HIGH Priority:** ~2-3 hours
- **MEDIUM Priority:** ~4-5 hours
- **LOW Priority:** ~11-13 hours

**Minimum for Production:** Complete HIGH priority items (2-3 hours)

---

**Last Updated:** 2026-01-26
