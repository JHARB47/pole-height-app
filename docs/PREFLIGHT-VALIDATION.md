# Preflight Validation Specification

**Version:** 1.0.0  
**Date:** 2026-01-27  
**Status:** SPECIFICATION (Implementation Required)

---

## 1. Overview

This document specifies the **Preflight Validation System** for PolePlan Pro exports and critical operations. Preflight validation runs BEFORE attempting to generate outputs, preventing partial failures and providing actionable error messages to users.

**Key Principles:**
1. **Fail Fast**: Validate before expensive operations (PDF generation, GIS processing)
2. **Actionable Errors**: Every error includes specific field name and suggested fix
3. **Severity Levels**: Distinguish between blocking errors and non-blocking warnings
4. **User Guidance**: Link errors to specific UI sections for resolution

---

## 2. Validation Architecture

### 2.1 Validation Result Schema

```typescript
interface ValidationResult {
  // Can the operation proceed?
  canProceed: boolean;
  
  // Severity levels
  errors: ValidationMessage[];      // Blocking issues
  warnings: ValidationMessage[];    // Non-blocking concerns
  info: ValidationMessage[];        // Helpful suggestions
  
  // Summary metrics
  severity: 'pass' | 'warning' | 'error';
  errorCount: number;
  warningCount: number;
  
  // Metadata
  validatedAt: string;  // ISO timestamp
  validator: string;    // Function name for debugging
}

interface ValidationMessage {
  code: string;              // e.g., 'ERR_VAL_MISSING_COORDS'
  field: string;             // e.g., 'poleLatitude'
  message: string;           // Human-readable error
  suggestedAction?: string;  // e.g., 'Import pole locations in Data Intake'
  navigateTo?: {             // Navigation hint for UI
    step: number;            // Workflow step number (1-6)
    section?: string;        // Section ID within step
  };
  affectedItems?: string[];  // e.g., ['Pole #1', 'Pole #3']
}
```

### 2.2 Validation Function Pattern

All validators follow this pattern:

```javascript
/**
 * Validates data for [operation name]
 * @param {Object} state - Zustand store state
 * @param {Object} options - Validator-specific options
 * @returns {ValidationResult}
 */
export function validate[OperationName](state, options = {}) {
  const errors = [];
  const warnings = [];
  const info = [];
  
  // Validation logic here
  
  return {
    canProceed: errors.length === 0,
    errors,
    warnings,
    info,
    severity: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'pass',
    errorCount: errors.length,
    warningCount: warnings.length,
    validatedAt: new Date().toISOString(),
    validator: 'validate[OperationName]',
  };
}
```

---

## 3. Import Validation

### 3.1 CSV Import Validation

**Function:** `validateCSVImport(file, mappingPreset)`

**Checks:**
1. ✅ File is readable and parseable as CSV
2. ✅ CSV has headers (first row)
3. ✅ Required columns present (based on mapping preset)
4. ⚠️  Column names match expected format (fuzzy match with suggestions)
5. ⚠️  Data types correct (numeric fields contain numbers)
6. ⚠️  Coordinate values in valid ranges (lat: -90 to 90, lon: -180 to 180)

**Error Codes:**
```javascript
'ERR_IMP_NOT_CSV'           // File is not valid CSV format
'ERR_IMP_NO_HEADERS'        // CSV missing header row
'ERR_IMP_MISSING_COLUMNS'   // Required columns not found
'ERR_IMP_INVALID_DATA_TYPE' // Column contains wrong data type
'ERR_IMP_INVALID_COORDS'    // Coordinates out of valid range
```

**Example Return:**
```javascript
{
  canProceed: false,
  errors: [
    {
      code: 'ERR_IMP_MISSING_COLUMNS',
      field: 'latitude',
      message: 'Required column "latitude" not found in CSV',
      suggestedAction: 'Verify your CSV has a latitude column, or select a different mapping preset',
      affectedItems: null
    }
  ],
  warnings: [
    {
      code: 'WARN_IMP_FUZZY_MATCH',
      field: 'pole_height',
      message: 'Column "pole_ht" does not exactly match expected "pole_height" - using fuzzy match',
      suggestedAction: null
    }
  ],
  info: [],
  severity: 'error',
  errorCount: 1,
  warningCount: 1,
  validatedAt: '2026-01-27T12:00:00.000Z',
  validator: 'validateCSVImport'
}
```

### 3.2 Geospatial File Import Validation

**Function:** `validateGeospatialImport(file)`

**Checks:**
1. ✅ File extension matches supported formats (.kml, .kmz, .geojson, .zip)
2. ✅ File is parseable (valid XML for KML, valid JSON for GeoJSON)
3. ✅ Contains geometry features (points or linestrings)
4. ⚠️  Coordinate system is WGS84 (EPSG:4326) or can be auto-detected
5. ⚠️  Feature properties include useful attributes

**Error Codes:**
```javascript
'ERR_IMP_UNSUPPORTED_FORMAT'  // File format not supported
'ERR_IMP_INVALID_KML'         // KML/KMZ parse error
'ERR_IMP_INVALID_GEOJSON'     // GeoJSON parse error
'ERR_IMP_NO_FEATURES'         // File contains no geometry features
'ERR_IMP_WRONG_GEOMETRY'      // Features are not Points or LineStrings
'WARN_IMP_NO_CRS'             // Coordinate system not specified
```

### 3.3 Batch Import Validation

**Function:** `validateBatchImport(poles, spans)`

**Checks:**
1. ✅ Arrays are not empty
2. ✅ Each pole has required fields (id, latitude, longitude)
3. ✅ Each span references valid pole IDs (from/to)
4. ⚠️  Pole IDs are unique
5. ⚠️  Span geometry is valid (length > 0, endpoints different)

**Error Codes:**
```javascript
'ERR_IMP_EMPTY_BATCH'       // No poles or spans provided
'ERR_IMP_MISSING_POLE_ID'   // Pole missing required ID
'ERR_IMP_DUPLICATE_POLE_ID' // Pole ID appears multiple times
'ERR_IMP_INVALID_SPAN_REF'  // Span references non-existent pole
'ERR_IMP_SPAN_SELF_LOOP'    // Span from/to same pole
```

---

## 4. Export Validation

### 4.1 GIS Export Preflight

**Function:** `validateGISExportPreflight(state, format)`

**Checks:**
1. ✅ At least 1 pole OR span exists
2. ✅ Poles have valid coordinates (lat/lon)
3. ⚠️  Pole IDs present (will auto-generate if missing)
4. ⚠️  Span geometry available (will export points only if missing)
5. ℹ️  CRS will be WGS84 (EPSG:4326)

**Error Codes:**
```javascript
'ERR_EXP_NO_DATA'           // No poles or spans to export
'ERR_EXP_NO_COORDINATES'    // Poles missing lat/lon
'WARN_EXP_NO_POLE_IDS'      // Poles missing IDs (will auto-generate)
'WARN_EXP_NO_SPANS'         // No span geometry (points only export)
'INFO_EXP_CRS_WGS84'        // Export will use WGS84 coordinate system
```

**Format-Specific Checks:**

**Shapefile:**
- ⚠️  Field names truncated to 10 characters (DBF limitation)
- ⚠️  Special characters removed from field names

**KML/KMZ:**
- ℹ️  Features will be grouped by type (poles, spans)
- ℹ️  Custom properties will be in Description field

**GeoJSON:**
- ℹ️  Full property names preserved
- ℹ️  Native coordinate precision

**Example Return:**
```javascript
{
  canProceed: true,
  errors: [],
  warnings: [
    {
      code: 'WARN_EXP_NO_POLE_IDS',
      field: 'poleId',
      message: '5 poles missing IDs - will generate as "pole_1", "pole_2", etc.',
      suggestedAction: 'Add pole IDs in Data Intake for better identification',
      navigateTo: { step: 2 },
      affectedItems: ['Pole at (40.123, -80.456)', '...']
    }
  ],
  info: [
    {
      code: 'INFO_EXP_CRS_WGS84',
      message: 'Export will use WGS84 (EPSG:4326) coordinate system'
    }
  ],
  severity: 'warning',
  errorCount: 0,
  warningCount: 1,
  validatedAt: '2026-01-27T12:05:00.000Z',
  validator: 'validateGISExportPreflight'
}
```

### 4.2 Permit Report Preflight

**Function:** `validatePermitReportPreflight(state)`

**Checks:**
1. ✅ Project metadata complete
   - Project Name (non-empty)
   - Job Number (non-empty)
   - Applicant Name (non-empty)
   - Job Owner (utility name)
2. ✅ Pole data complete
   - Pole Height (numeric, > 0)
   - Pole Class (valid enum)
3. ✅ Existing plant data
   - Existing Power Height (numeric, > 0)
   - Existing Power Voltage (valid enum)
4. ✅ Span data
   - Span Length (numeric, > 0) OR calculable from coordinates
   - Span Environment (valid enum)
5. ⚠️  Proposed attach height (will auto-calculate if missing)
6. ⚠️  Clearance calculations (will compute on-the-fly)

**Error Codes:**
```javascript
'ERR_EXP_MISSING_PROJECT_NAME'    // Project name not set
'ERR_EXP_MISSING_JOB_NUMBER'      // Job number not set
'ERR_EXP_MISSING_APPLICANT'       // Applicant name not set
'ERR_EXP_MISSING_JOB_OWNER'       // Utility owner not set
'ERR_EXP_MISSING_POLE_HEIGHT'     // Pole height not specified
'ERR_EXP_MISSING_POLE_CLASS'      // Pole class not specified
'ERR_EXP_MISSING_EXISTING_HEIGHT' // Existing power height not set
'ERR_EXP_MISSING_EXISTING_VOLTAGE'// Existing voltage not set
'ERR_EXP_MISSING_SPAN_LENGTH'     // Span length not available
'ERR_EXP_MISSING_SPAN_ENVIRONMENT'// Span environment not set
'WARN_EXP_NO_PROPOSED_HEIGHT'     // Will auto-calculate attach height
```

**Example Return:**
```javascript
{
  canProceed: false,
  errors: [
    {
      code: 'ERR_EXP_MISSING_JOB_NUMBER',
      field: 'jobNumber',
      message: 'Job Number is required for permit reports',
      suggestedAction: 'Enter Job Number in Project Setup',
      navigateTo: { step: 1, section: 'job-metadata' }
    },
    {
      code: 'ERR_EXP_MISSING_EXISTING_HEIGHT',
      field: 'existingPowerHeight',
      message: 'Existing Power Height is required for clearance calculations',
      suggestedAction: 'Enter Existing Power Height in Existing Plant',
      navigateTo: { step: 3, section: 'existing-power' }
    }
  ],
  warnings: [],
  info: [],
  severity: 'error',
  errorCount: 2,
  warningCount: 0,
  validatedAt: '2026-01-27T12:10:00.000Z',
  validator: 'validatePermitReportPreflight'
}
```

### 4.3 FirstEnergy Export Preflight

**Function:** `validateFirstEnergyExportPreflight(state)`

**Checks:**
1. ✅ Submission profile is FirstEnergy family
2. ✅ Job Owner specified (utility name)
3. ✅ Poles have coordinates (lat/lon)
4. ✅ Pole height specified
5. ✅ Proposed attach height available
6. ⚠️  Coordinates within FirstEnergy territory (PA/WV/OH/NJ/MD)
7. ⚠️  Make-ready notes present (optional but recommended)

**Error Codes:**
```javascript
'ERR_EXP_WRONG_PROFILE'         // Submission profile is not FirstEnergy
'ERR_EXP_MISSING_OWNER'         // Job owner not specified
'ERR_EXP_FE_NO_COORDS'          // Poles missing coordinates
'ERR_EXP_FE_NO_HEIGHT'          // Pole height missing
'ERR_EXP_FE_NO_ATTACH'          // Proposed attach height missing
'WARN_EXP_FE_OUTSIDE_TERRITORY' // Coordinates outside typical FE service area
'WARN_EXP_FE_NO_MAKEREADY'      // No make-ready notes (recommended for FE)
```

**Example Return:**
```javascript
{
  canProceed: true,
  errors: [],
  warnings: [
    {
      code: 'WARN_EXP_FE_OUTSIDE_TERRITORY',
      field: 'poleLatitude',
      message: 'Coordinates appear to be outside FirstEnergy service territory',
      suggestedAction: 'Verify Job Owner is correct for this location',
      navigateTo: { step: 1, section: 'job-owner' },
      affectedItems: ['Pole #1 (lat: 35.123, lon: -90.456)']
    }
  ],
  info: [],
  severity: 'warning',
  errorCount: 0,
  warningCount: 1,
  validatedAt: '2026-01-27T12:15:00.000Z',
  validator: 'validateFirstEnergyExportPreflight'
}
```

### 4.4 Field Collection Export Preflight

**Function:** `validateFieldCollectionPreflight(state)`

**Checks:**
1. ✅ At least 1 pole in collection
2. ✅ Poles have GPS coordinates (lat/lon)
3. ⚠️  Status field populated (e.g., "surveyed", "pending")
4. ⚠️  Photos attached (recommended for documentation)
5. ℹ️  Timestamp will be included for each pole

**Error Codes:**
```javascript
'ERR_EXP_NO_POLES'           // No poles collected
'ERR_EXP_NO_GPS'             // Poles missing GPS coordinates
'WARN_EXP_NO_STATUS'         // Status field not populated
'WARN_EXP_NO_PHOTOS'         // No photos attached
'INFO_EXP_TIMESTAMP_INCLUDED'// Collection timestamp will be included
```

---

## 5. Calculation Validation

### 5.1 Clearance Calculation Validation

**Function:** `validateClearanceCalculation(inputs)`

**Checks:**
1. ✅ All numeric inputs are valid numbers (not NaN, null, undefined)
2. ✅ Pole height > existing power height (if new attachment below power)
3. ✅ Span length > 0
4. ⚠️  Wind speed in reasonable range (50-120 mph)
5. ⚠️  Ice thickness in reasonable range (0-2 inches)

**Error Codes:**
```javascript
'ERR_CALC_INVALID_NUMBER'     // Input is not a valid number
'ERR_CALC_POLE_TOO_SHORT'     // Pole shorter than existing power
'ERR_CALC_ZERO_SPAN'          // Span length is zero
'WARN_CALC_HIGH_WIND'         // Wind speed > 120 mph (unusual)
'WARN_CALC_HIGH_ICE'          // Ice thickness > 2 inches (unusual)
```

### 5.2 Span Geometry Validation

**Function:** `validateSpanGeometry(fromPole, toPole)`

**Checks:**
1. ✅ Both poles have valid coordinates
2. ✅ Poles are not at same location (distance > 0)
3. ⚠️  Calculated span length matches manual entry (if provided)
4. ⚠️  Span length in reasonable range (10-1000 feet)

**Error Codes:**
```javascript
'ERR_CALC_MISSING_COORDS'     // One or both poles missing coordinates
'ERR_CALC_ZERO_DISTANCE'      // Poles at same location
'WARN_CALC_SPAN_MISMATCH'     // Calculated length differs from manual entry
'WARN_CALC_UNUSUAL_SPAN'      // Span length outside typical range
```

---

## 6. UI Integration

### 6.1 Preflight Check Panel

**Component:** `PreflightCheckPanel.jsx`

**Props:**
```typescript
interface PreflightCheckPanelProps {
  validationResult: ValidationResult;
  onNavigateToStep: (step: number, section?: string) => void;
  onRetry: () => void;
  deliverableName: string;
}
```

**UI Layout:**
```
┌─ Preflight Check: {Deliverable Name} ─────────────┐
│                                                    │
│ Status: ✅ Ready to Export                         │
│         ⚠️  Ready with Warnings                    │
│         ❌ Cannot Export (Fix Required)            │
│                                                    │
│ Issues Found:                                      │
│                                                    │
│ ❌ Error (2)                                       │
│ ├─ Missing: Job Number                            │
│ │  └─ [Fix in Project Setup →]                    │
│ └─ Missing: Existing Power Height                 │
│    └─ [Fix in Existing Plant →]                   │
│                                                    │
│ ⚠️  Warnings (1)                                   │
│ └─ 3 poles missing status field                   │
│    └─ [Add Status in Field Collection →]          │
│                                                    │
│ ℹ️  Info (1)                                       │
│ └─ Export will use WGS84 coordinate system        │
│                                                    │
│ [Retry Validation]  [Export Anyway] [Cancel]      │
└────────────────────────────────────────────────────┘
```

**Behavior:**
- Auto-run validation on panel mount
- "Fix in [Step]" buttons navigate to specific step
- "Export Anyway" button enabled only if `canProceed === true` (warnings OK, errors block)
- "Retry Validation" re-runs check after user fixes issues

### 6.2 Inline Validation Feedback

**Location:** Form fields in workflow panels

**Pattern:**
- Run validation on blur or change (debounced)
- Show inline error/warning icon next to field
- Display tooltip with specific error message

**Example:**
```jsx
<Input
  label="Job Number"
  value={jobNumber}
  onChange={setJobNumber}
  error={validation.errors.find(e => e.field === 'jobNumber')}
  warning={validation.warnings.find(w => w.field === 'jobNumber')}
/>
```

**Visual States:**
```
Job Number  ❌ Required for permit reports
            [                              ]

Pole IDs    ⚠️  Missing - will auto-generate
            [                              ]

Status      ℹ️  Recommended for tracking
            [                              ]
```

---

## 7. Error Recovery Patterns

### 7.1 Auto-Correction

Where possible, auto-correct common issues:

**Example:** Auto-generate pole IDs
```javascript
function autoCorrectMissingPoleIds(poles) {
  return poles.map((pole, index) => ({
    ...pole,
    id: pole.id || `pole_${index + 1}`,
  }));
}
```

**Log to user:**
```
ℹ️  Auto-corrected: Generated IDs for 5 poles (pole_1, pole_2, ...)
```

### 7.2 Partial Export

Allow exporting subset of data when some records are invalid:

**Example:** Export valid poles only
```javascript
function exportValidPolesOnly(poles, validationResult) {
  const invalidPoleIds = validationResult.errors
    .filter(e => e.affectedItems)
    .flatMap(e => e.affectedItems);
  
  const validPoles = poles.filter(p => !invalidPoleIds.includes(p.id));
  
  return {
    exportedPoles: validPoles,
    skippedCount: poles.length - validPoles.length,
  };
}
```

**Log to user:**
```
⚠️  Exported 15 of 18 poles (3 skipped due to missing coordinates)
```

### 7.3 Guided Fix Flow

For critical errors, guide user step-by-step:

**Example:** Missing job metadata
```
❌ Cannot generate permit report

Missing required information:
1. Job Number → [Go to Project Setup]
2. Existing Power Height → [Go to Existing Plant]

[Start Guided Fix]
```

**Guided Fix Flow:**
1. Navigate to first error's step
2. Highlight specific field
3. Wait for user to fill
4. Auto-advance to next error
5. Re-validate when complete

---

## 8. Performance Considerations

### 8.1 Validation Timing

**Sync Validators** (< 50ms):
- Field-level validation (single value checks)
- Small dataset validation (< 100 records)

**Async Validators** (< 500ms):
- Large dataset validation (100+ records)
- File parsing (CSV, KML, GeoJSON)
- Coordinate system transformations

**Pattern:**
```javascript
export async function validateLargeDataset(records) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Validation logic in microtask to avoid blocking UI
      const result = performValidation(records);
      resolve(result);
    }, 0);
  });
}
```

### 8.2 Validation Caching

Cache validation results for unchanged data:

```javascript
const validationCache = new Map();

function getCachedValidation(state, validator) {
  const cacheKey = `${validator}_${hashState(state)}`;
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey);
  }
  const result = validator(state);
  validationCache.set(cacheKey, result);
  return result;
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Test Coverage Targets:**
- ✅ 100% coverage for validation functions
- ✅ All error codes exercised
- ✅ All warning codes exercised
- ✅ Edge cases (empty state, null values, boundary conditions)

**Example Test:**
```javascript
describe('validateGISExportPreflight', () => {
  test('blocks export when no poles', () => {
    const state = { collectedPoles: [] };
    const result = validateGISExportPreflight(state);
    
    expect(result.canProceed).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'ERR_EXP_NO_DATA',
      })
    );
  });
  
  test('warns when poles missing IDs', () => {
    const state = {
      collectedPoles: [
        { latitude: 40.0, longitude: -80.0 },
        { latitude: 40.1, longitude: -80.1 },
      ],
    };
    const result = validateGISExportPreflight(state);
    
    expect(result.canProceed).toBe(true);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'WARN_EXP_NO_POLE_IDS',
      })
    );
  });
});
```

### 9.2 Integration Tests

Test validation → UI → navigation flow:

```javascript
describe('Preflight UI Integration', () => {
  test('navigates to correct step when clicking fix button', async () => {
    const mockNavigate = vi.fn();
    
    render(
      <PreflightCheckPanel
        validationResult={mockErrorResult}
        onNavigateToStep={mockNavigate}
      />
    );
    
    const fixButton = screen.getByText(/Fix in Project Setup/);
    await userEvent.click(fixButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(1, 'job-metadata');
  });
});
```

### 9.3 E2E Tests

Test real user workflows:

```javascript
test('user fixes validation errors and successfully exports', async ({ page }) => {
  // Navigate to outputs
  await page.click('[data-step="6"]');
  
  // See validation error
  await expect(page.locator('.preflight-error')).toContainText('Missing: Job Number');
  
  // Click fix button
  await page.click('text=Fix in Project Setup');
  
  // Fill job number
  await page.fill('[name="jobNumber"]', 'TEST-001');
  
  // Navigate back to outputs
  await page.click('[data-step="6"]');
  
  // Validation now passes
  await expect(page.locator('.preflight-status')).toContainText('Ready to Export');
  
  // Export succeeds
  await page.click('text=Export GIS Data');
  await expect(page.locator('.toast-success')).toBeVisible();
});
```

---

## 10. Error Code Registry

### 10.1 Import Errors (ERR_IMP_*)

| Code | Severity | Message Template | Suggested Action |
|------|----------|------------------|------------------|
| `ERR_IMP_NOT_CSV` | Error | File is not valid CSV format | Verify file extension is .csv and content is comma-separated |
| `ERR_IMP_NO_HEADERS` | Error | CSV missing header row | Add column names in first row of CSV |
| `ERR_IMP_MISSING_COLUMNS` | Error | Required column "{column}" not found | Verify CSV has {column} or select different mapping preset |
| `ERR_IMP_INVALID_DATA_TYPE` | Error | Column "{column}" contains invalid data type | Ensure {column} contains {type} values |
| `ERR_IMP_INVALID_COORDS` | Error | Coordinates out of valid range | Latitude must be -90 to 90, longitude -180 to 180 |
| `ERR_IMP_UNSUPPORTED_FORMAT` | Error | File format not supported | Use .kml, .kmz, .geojson, or .zip (shapefile) |
| `ERR_IMP_INVALID_KML` | Error | KML/KMZ parse error: {detail} | Verify file is valid KML/KMZ format |
| `ERR_IMP_NO_FEATURES` | Error | File contains no geometry features | Ensure file has Point or LineString features |
| `ERR_IMP_EMPTY_BATCH` | Error | No poles or spans provided | Provide at least 1 pole or span to import |
| `ERR_IMP_DUPLICATE_POLE_ID` | Error | Pole ID "{id}" appears multiple times | Ensure pole IDs are unique |

### 10.2 Export Errors (ERR_EXP_*)

| Code | Severity | Message Template | Suggested Action |
|------|----------|------------------|------------------|
| `ERR_EXP_NO_DATA` | Error | No poles or spans to export | Import data in Data Intake |
| `ERR_EXP_NO_COORDINATES` | Error | Poles missing latitude/longitude | Import pole locations or add GPS data |
| `ERR_EXP_MISSING_PROJECT_NAME` | Error | Project Name is required | Enter Project Name in Project Setup |
| `ERR_EXP_MISSING_JOB_NUMBER` | Error | Job Number is required for permit reports | Enter Job Number in Project Setup |
| `ERR_EXP_MISSING_POLE_HEIGHT` | Error | Pole Height is required | Enter Pole Height in Data Intake or Span Modeling |
| `ERR_EXP_MISSING_EXISTING_HEIGHT` | Error | Existing Power Height is required | Enter Existing Power Height in Existing Plant |
| `ERR_EXP_MISSING_SPAN_LENGTH` | Error | Span length not available | Enter span distance or import poles with coordinates |
| `ERR_EXP_WRONG_PROFILE` | Error | Submission profile must be FirstEnergy for this export | Change profile in Project Setup |

### 10.3 Calculation Errors (ERR_CALC_*)

| Code | Severity | Message Template | Suggested Action |
|------|----------|------------------|------------------|
| `ERR_CALC_INVALID_NUMBER` | Error | "{field}" is not a valid number | Enter numeric value for {field} |
| `ERR_CALC_POLE_TOO_SHORT` | Error | Pole height ({poleHt}) shorter than existing power ({powerHt}) | Increase pole height or verify existing power height |
| `ERR_CALC_ZERO_SPAN` | Error | Span length is zero | Enter span distance or verify pole coordinates are different |
| `ERR_CALC_MISSING_COORDS` | Error | Poles missing coordinates for span calculation | Add latitude/longitude for both poles |

### 10.4 Warnings (WARN_*)

| Code | Severity | Message Template | Suggested Action |
|------|----------|------------------|------------------|
| `WARN_EXP_NO_POLE_IDS` | Warning | {count} poles missing IDs - will auto-generate | Add pole IDs in Data Intake for better identification |
| `WARN_EXP_NO_SPANS` | Warning | No span geometry - export will contain points only | Import spans or add span data for LineString features |
| `WARN_EXP_FE_OUTSIDE_TERRITORY` | Warning | Coordinates outside FirstEnergy service territory | Verify Job Owner is correct for this location |
| `WARN_CALC_HIGH_WIND` | Warning | Wind speed ({windSpeed}) is unusually high | Verify wind speed is correct (typical range: 50-120 mph) |
| `WARN_CALC_SPAN_MISMATCH` | Warning | Calculated span ({calc}) differs from manual entry ({manual}) | Verify span distance or recalculate from coordinates |

---

## 11. Implementation Checklist

### Core Functions
- [ ] Create `/src/utils/preflightValidation.js`
  - [ ] `validateGISExportPreflight(state, format)`
  - [ ] `validatePermitReportPreflight(state)`
  - [ ] `validateFirstEnergyExportPreflight(state)`
  - [ ] `validateFieldCollectionPreflight(state)`
  - [ ] `validateCSVImport(file, mappingPreset)`
  - [ ] `validateGeospatialImport(file)`
  - [ ] `validateBatchImport(poles, spans)`
  - [ ] `validateClearanceCalculation(inputs)`
  - [ ] `validateSpanGeometry(fromPole, toPole)`

### UI Components
- [ ] Create `/src/components/PreflightCheckPanel.jsx`
  - [ ] Display validation results
  - [ ] Grouped errors/warnings/info
  - [ ] "Fix in [Step]" navigation buttons
  - [ ] Retry validation button
  - [ ] Conditional export button

### Integration
- [ ] Integrate preflight checks in `/src/components/workflow/panels/OutputsPanel.jsx`
- [ ] Add inline validation to form fields
- [ ] Add validation error display to import flows
- [ ] Add guided fix flow navigation

### Testing
- [ ] Unit tests for all validation functions
- [ ] Integration tests for UI components
- [ ] E2E tests for validation → fix → export flow

---

**End of Preflight Validation Specification**
