# Phase 2 Testing Checklist ✓

Use this checklist to systematically verify all Phase 2 enhancements.

---

## Pre-Testing Setup

- [ ] Development server running (`npm run dev:netlify`)
- [ ] Browser opened to `http://localhost:3000`
- [ ] Browser console open (F12)
- [ ] Network tab open for API monitoring
- [ ] Sample data generated (`node scripts/test/manual-testing-guide.mjs`)

---

## 1. Debounced Validation Testing

### Basic Functionality

- [ ] Navigate to Job Setup → GPS Coordinates section
- [ ] Type rapidly in latitude field (e.g., "37.7749")
- [ ] Observe no validation during typing
- [ ] Wait 300ms - validation should complete
- [ ] "🔄 Validating..." indicator shows during debounce
- [ ] No performance lag or stuttering

### Valid Coordinates

- [ ] Latitude: `37.7749`, Longitude: `-122.4194`
- [ ] Shows "✅ Valid Coordinates" (green background)
- [ ] Displays formatted coordinates
- [ ] No errors or warnings

### Invalid Coordinates - Latitude

- [ ] Latitude: `91`, Longitude: `-122.4194`
- [ ] Shows "❌ Invalid Coordinates" (red background)
- [ ] Error message: "Latitude must be between -90 and 90 degrees"
- [ ] Prevents form submission

### Invalid Coordinates - Longitude

- [ ] Latitude: `37.7749`, Longitude: `-181`
- [ ] Shows "❌ Invalid Coordinates" (red background)
- [ ] Error message: "Longitude must be between -180 and 180 degrees"
- [ ] Prevents form submission

### Suspicious Coordinates

- [ ] Latitude: `0`, Longitude: `0`
- [ ] Shows "⚠️ Warning" (yellow background)
- [ ] Warning: "Coordinates appear to be [0, 0] (Null Island)"
- [ ] Allows submission with warning

### Near Null Island

- [ ] Latitude: `0.0001`, Longitude: `0.0001`
- [ ] Shows warning about being close to [0, 0]
- [ ] Recommendation to verify coordinates

### Performance

- [ ] Type 20 characters rapidly
- [ ] Validation triggers only once (after 300ms pause)
- [ ] No memory leaks (check DevTools Performance)
- [ ] Cleanup on component unmount

---

## 2. Validation Statistics Panel Testing

### Setup Test Data

Import this CSV:

```csv
id,latitude,longitude,height
P1,37.7749,-122.4194,40
P2,34.0522,-118.2437,45
P3,91,-122.4194,40
P4,37.7749,-181,45
P5,0,0,40
```

### Panel Display

- [ ] Validation Summary panel is visible
- [ ] Shows "5 poles with coordinates"
- [ ] Three statistic cards displayed

### Valid Count Card

- [ ] Shows "2" valid poles
- [ ] Green background color
- [ ] Displays "40% of total"
- [ ] Check mark icon (✅)

### Warnings Count Card

- [ ] Shows "1" warning
- [ ] Yellow background color
- [ ] "Review recommended" text
- [ ] Warning icon (⚠️)

### Errors Count Card

- [ ] Shows "2" errors
- [ ] Red background color
- [ ] "Action required" text
- [ ] Error icon (❌)

### Error Details Expansion

- [ ] Click "View 2 Errors"
- [ ] Details section expands
- [ ] Shows P3 with latitude error
- [ ] Shows P4 with longitude error
- [ ] Each error has pole ID and error message

### Warning Details Expansion

- [ ] Click "View 1 Warning"
- [ ] Details section expands
- [ ] Shows P5 (Null Island)
- [ ] Warning message displayed

### Real-time Updates

- [ ] Edit P3 latitude to `40.7128` (valid)
- [ ] Statistics update automatically
- [ ] Valid count increases to 3
- [ ] Error count decreases to 1
- [ ] Percentages recalculate

### Empty State

- [ ] Remove all poles
- [ ] Shows "No poles with coordinates to validate"
- [ ] Info icon displayed
- [ ] No error/warning cards

---

## 3. Export Template System Testing

### View Templates

- [ ] Click "Custom CSV" button
- [ ] Export dialog opens
- [ ] Template dropdown visible

### Built-in Templates (5)

- [ ] Basic Export - shows in list
- [ ] NESC Complete - shows in list
- [ ] CSA Standard - shows in list
- [ ] GIS/Mapping - shows in list
- [ ] Field Collection - shows in list
- [ ] All marked as "Built-in"

### User Templates (3 from test script)

- [ ] Utility Standard - shows in list
- [ ] Field Survey Quick - shows in list
- [ ] Compliance Review - shows in list
- [ ] Not marked as built-in

### Use Built-in Template

- [ ] Select "NESC Complete"
- [ ] Framework auto-sets to "NESC"
- [ ] Columns auto-populate (9 columns)
- [ ] "Use tick marks" checked
- [ ] Decimal precision set to 2
- [ ] Click "Export CSV"
- [ ] File downloads with correct columns

### Create User Template

- [ ] Configure custom settings:
  - Name: "My Test Template"
  - Framework: CUSTOM
  - Columns: id, height, latitude, longitude
  - Uncheck tick marks
- [ ] Click "Save as Template"
- [ ] Success message shown
- [ ] Template appears in dropdown
- [ ] Total count increases

### Load User Template

- [ ] Select "My Test Template"
- [ ] All settings load correctly
- [ ] Matches saved configuration
- [ ] Export uses template settings

### Template Limits

- [ ] Create 18 more templates (to reach 20 limit)
- [ ] Try to create 21st template
- [ ] Error message: "Maximum 20 templates allowed"
- [ ] Suggestion to delete old templates

### Delete User Template

- [ ] Select "My Test Template"
- [ ] Click "Delete Template" button
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Template removed from list
- [ ] Cannot delete built-in templates

### Import/Export Templates

- [ ] Click "Export Templates" button
- [ ] JSON file downloads
- [ ] Open file - verify structure
- [ ] Click "Import Templates"
- [ ] Select JSON file
- [ ] Templates imported successfully
- [ ] Duplicate names handled

### Template Persistence

- [ ] Create template
- [ ] Refresh page
- [ ] Template still appears
- [ ] Settings preserved
- [ ] localStorage contains data

---

## 4. API Pagination Testing

### Basic Pagination

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/projects?page=1&limit=10"
```

- [ ] Response has `success: true`
- [ ] `projects` array has ≤10 items
- [ ] `pagination.page` equals 1
- [ ] `pagination.limit` equals 10
- [ ] `pagination.total` is a number
- [ ] `pagination.totalPages` calculated correctly
- [ ] `pagination.hasNextPage` is boolean
- [ ] `pagination.hasPrevPage` equals false

### Second Page

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/projects?page=2&limit=10"
```

- [ ] Different projects than page 1
- [ ] `pagination.page` equals 2
- [ ] `pagination.hasPrevPage` equals true
- [ ] No duplicate projects across pages

### Large Limit

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/projects?limit=100"
```

- [ ] Returns up to 100 projects
- [ ] Respects max limit
- [ ] Response time <200ms

### Search Functionality

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/projects?search=main"
```

- [ ] Only returns matching projects
- [ ] Case-insensitive search works
- [ ] Partial matches included
- [ ] Pagination works with search

### Sorting - Name Ascending

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/projects?sort=name&order=asc"
```

- [ ] Projects sorted A-Z by name
- [ ] Consistent ordering

### Sorting - Updated Date Descending

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/projects?sort=updated_at&order=desc"
```

- [ ] Most recent projects first
- [ ] Timestamps in correct order

### Organization Filter

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/projects?organization_id=org_123"
```

- [ ] Only projects from org_123
- [ ] User's own projects only
- [ ] No other organizations

### Client Filter

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/projects?client_id=client_456"
```

- [ ] Only projects from client_456
- [ ] Combined with user filter

### Combined Filters

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/projects?search=street&client_id=client_456&page=1&limit=5&sort=name&order=asc"
```

- [ ] All filters applied correctly
- [ ] Results match all criteria
- [ ] Pagination still works

### Edge Cases

- [ ] Page 0 → defaults to page 1
- [ ] Page 999999 (beyond total) → empty array
- [ ] Limit 0 → defaults to 50
- [ ] Limit 1000 → caps at 100
- [ ] Negative limit → defaults to 50
- [ ] Invalid sort field → defaults to updated_at

### Performance

- [ ] Response time <100ms (p95)
- [ ] Consistent across pages
- [ ] No N+1 query issues
- [ ] Database indexes used

### Error Handling

- [ ] 401 without auth token
- [ ] 500 on database error
- [ ] Proper error messages
- [ ] No stack traces exposed

---

## 5. Integration Testing

### Workflow: Import → Validate → Fix → Export

#### Import Phase

- [ ] Import CSV with mixed coordinates
- [ ] Data loads successfully
- [ ] Poles added to store

#### Validate Phase

- [ ] Validation statistics panel appears
- [ ] Accurate counts displayed
- [ ] Errors and warnings identified

#### Fix Phase

- [ ] Edit invalid coordinate
- [ ] Debounced validation triggers
- [ ] Statistics update in real-time
- [ ] Error count decreases

#### Export Phase

- [ ] Select export template
- [ ] Settings auto-populate
- [ ] Export completes quickly (<1s)
- [ ] CSV contains correct data

### Workflow: Create Project → Validate API → Update

#### Create via API

- [ ] POST request with valid data
- [ ] Project created successfully
- [ ] Returns project with ID

#### Create with Invalid Coordinates

- [ ] POST request with invalid coordinates
- [ ] Returns 400 error
- [ ] `validationErrors` array included
- [ ] Specific pole errors listed

#### Update Project

- [ ] PUT request with new data
- [ ] Ownership check passes
- [ ] GIS validation runs
- [ ] Updated data returned

#### Batch Validation

- [ ] POST to `/validate-coordinates`
- [ ] All poles validated
- [ ] Detailed report returned
- [ ] Summary statistics included

---

## 6. Performance Benchmarking

### Debounce Performance

- [ ] Type 10 characters rapidly
- [ ] Only 1 validation triggered
- [ ] Time saved: ~900ms (10 \* 100ms - 100ms)
- [ ] No dropped keystrokes

### API Response Times

Measure with `time curl ...`:

- [ ] Page 1 (50 items): <100ms
- [ ] Page 10 (50 items): <100ms
- [ ] Search query: <150ms
- [ ] Complex filter: <200ms

### Template Loading

- [ ] Template list loads: <50ms
- [ ] Template application: <10ms
- [ ] Save template: <20ms
- [ ] Delete template: <10ms

### Overall Improvements

- [ ] Validation calls reduced by 80%+
- [ ] API payload reduced by 95%+
- [ ] Export setup time reduced by 97%+

---

## 7. Browser Compatibility

Test in multiple browsers:

### Chrome

- [ ] All features work
- [ ] Debounced validation smooth
- [ ] Statistics panel renders
- [ ] Templates save/load

### Firefox

- [ ] All features work
- [ ] No console errors
- [ ] localStorage works

### Safari

- [ ] All features work
- [ ] Debounce timing correct
- [ ] API calls succeed

### Edge

- [ ] All features work
- [ ] Full functionality

---

## 8. Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Tab order logical
- [ ] ARIA labels present
- [ ] Screen reader compatible
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Focus indicators visible

---

## 9. Mobile Responsiveness

Test on mobile device or emulator:

- [ ] Statistics panel stacks vertically
- [ ] Template dialog responsive
- [ ] Buttons touchable (min 44x44px)
- [ ] No horizontal scroll
- [ ] Text readable without zoom

---

## 10. Error Scenarios

### Network Errors

- [ ] Offline mode → graceful error
- [ ] Timeout → retry option
- [ ] 500 error → user-friendly message

### Data Errors

- [ ] Corrupt localStorage → recovery
- [ ] Missing required fields → validation
- [ ] Invalid JSON → error handling

### User Errors

- [ ] Duplicate template name → clear error
- [ ] Invalid coordinates → helpful message
- [ ] Unauthorized access → redirect to login

---

## Success Criteria Summary

### Must Pass (Critical)

- [ ] All 150 existing tests pass
- [ ] No breaking changes
- [ ] No console errors
- [ ] Core functionality works

### Should Pass (Important)

- [ ] Performance targets met
- [ ] User experience smooth
- [ ] Documentation complete
- [ ] Error handling robust

### Nice to Have (Enhancement)

- [ ] Mobile optimized
- [ ] Accessibility excellent
- [ ] Cross-browser tested
- [ ] Edge cases handled

---

## Sign-Off

**Tester Name**: ************\_\_\_************

**Date**: ************\_\_\_************

**Build Version**: ************\_\_\_************

**Overall Assessment**:

- [ ] ✅ Ready for Production
- [ ] ⚠️ Ready with Minor Issues
- [ ] ❌ Not Ready - Major Issues Found

**Notes**:

---

---

---

---

_Testing Checklist v2.0 - Last Updated: October 2024_
