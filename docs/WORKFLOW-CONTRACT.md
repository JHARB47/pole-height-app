# Workflow Contract - PolePlan Pro Deliverable-Based Workflows

**Version:** 1.0.0  
**Date:** 2026-01-27  
**Status:** SPECIFICATION (Implementation Required)

---

## 1. Executive Summary

This document defines the **Deliverable-Based Workflow System** for PolePlan Pro. Instead of forcing users through all 6 steps regardless of their needs, the system allows users to select their desired deliverables and computes which steps and data are required. Steps can be skipped if not needed for the chosen outputs.

**Key Principles:**

1. **No Broken States**: Missing optional data never causes crashes or null reference errors
2. **Progressive Disclosure**: Only show required steps; optional steps are clearly marked
3. **Preflight Validation**: Export functions validate requirements before attempting to generate outputs
4. **Backward Compatible**: Full 6-step workflow remains unchanged for users who select all deliverables

---

## 2. Deliverable Types

### 2.1 Available Deliverables

| Deliverable ID       | User-Facing Name                   | Description                                          |
| -------------------- | ---------------------------------- | ---------------------------------------------------- |
| `gis_export`         | GIS Export (GeoJSON/KML/Shapefile) | Geospatial data export with pole locations and spans |
| `permit_report`      | Permit Report (PDF)                | NESC compliance report with clearance calculations   |
| `firstenergy_export` | FirstEnergy Joint Use CSV          | FirstEnergy-specific manifest format                 |
| `field_collection`   | Field Collection Data              | GPS coordinates, photos, status notes                |
| `clearance_analysis` | Span & Clearance Analysis          | Detailed midspan clearance calculations              |
| `existing_plant_doc` | Existing Plant Documentation       | Attachment inventory and make-ready notes            |

### 2.2 Deliverable Combinations

Users can select any combination. Common scenarios:

**Scenario A: GIS Export Only**

- Deliverable: `gis_export`
- Use Case: Asset mapping, coordination with municipalities
- Required Steps: Project Setup (1), Data Intake (2)
- Optional Steps: Everything else

**Scenario B: Permit Package**

- Deliverables: `permit_report`, `gis_export`
- Use Case: Utility permit submission
- Required Steps: 1, 2, 3, 4
- Optional Steps: 5, 6 (auto-included)

**Scenario C: Field Collection Only**

- Deliverable: `field_collection`
- Use Case: Pre-engineering site survey
- Required Steps: 1, 2
- Optional Steps: 3, 4

**Scenario D: Full Workflow** (backward compatible)

- Deliverables: ALL
- Required Steps: ALL

**Scenario E: FirstEnergy Submission**

- Deliverables: `firstenergy_export`, `permit_report`
- Required Steps: 1, 2, 3, 4
- Optional Steps: 5

---

## 3. Requirements Matrix

### 3.1 Data Requirements Per Deliverable

| Data Element                  | GIS Export  | Permit Report | FirstEnergy | Field Collection | Clearance Analysis | Existing Plant Doc |
| ----------------------------- | ----------- | ------------- | ----------- | ---------------- | ------------------ | ------------------ |
| **Job Metadata**              | ✅ Required | ✅ Required   | ✅ Required | ✅ Required      | ✅ Required        | ✅ Required        |
| Project Name                  | ✅          | ✅            | ✅          | ✅               | ✅                 | ✅                 |
| Job Number                    | ⚪ Optional | ✅            | ✅          | ⚪ Optional      | ⚪ Optional        | ⚪ Optional        |
| Applicant Name                | ⚪ Optional | ✅            | ✅          | ⚪ Optional      | ⚪ Optional        | ⚪ Optional        |
| Job Owner (Utility)           | ⚪ Optional | ✅            | ✅          | ⚪ Optional      | ⚪ Optional        | ⚪ Optional        |
| **Pole Data**                 |             |               |             |                  |                    |                    |
| Pole Locations (lat/lon)      | ✅          | ⚪ Optional   | ✅          | ✅               | ⚪ Optional        | ⚪ Optional        |
| Pole Height                   | ⚪ Optional | ✅            | ✅          | ⚪ Optional      | ✅                 | ⚪ Optional        |
| Pole Class                    | ⚪ Optional | ✅            | ✅          | ⚪ Optional      | ✅                 | ⚪ Optional        |
| Pole IDs/Tags                 | ✅          | ✅            | ✅          | ✅               | ⚪ Optional        | ⚪ Optional        |
| **Span Data**                 |             |               |             |                  |                    |                    |
| Span Geometry (LineStrings)   | ✅          | ⚪ Optional   | ⚪ Optional | ⚪ Optional      | ⚪ Optional        | ⚪ Optional        |
| Span Length                   | ⚪ Optional | ✅            | ⚪ Optional | ⚪ Optional      | ✅                 | ⚪ Optional        |
| Span Environment (road/alley) | ⚪ Optional | ✅            | ⚪ Optional | ⚪ Optional      | ✅                 | ⚪ Optional        |
| **Existing Plant**            |             |               |             |                  |                    |                    |
| Existing Power Height         | ⚪ Optional | ✅            | ⚪ Optional | ⚪ Optional      | ✅                 | ✅                 |
| Existing Attachments          | ⚪ Optional | ⚪ Optional   | ⚪ Optional | ⚪ Optional      | ⚪ Optional        | ✅                 |
| Make-Ready Notes              | ⚪ Optional | ⚪ Optional   | ⚪ Optional | ⚪ Optional      | ⚪ Optional        | ✅                 |
| **Clearance Calculations**    |             |               |             |                  |                    |                    |
| Proposed Attach Height        | ⚪ Optional | ✅            | ✅          | ⚪ Optional      | ✅                 | ⚪ Optional        |
| Ground Clearance              | ⚪ Optional | ✅            | ⚪ Optional | ⚪ Optional      | ✅                 | ⚪ Optional        |
| Midspan Sag                   | ⚪ Optional | ✅            | ⚪ Optional | ⚪ Optional      | ✅                 | ⚪ Optional        |
| **Field Collection**          |             |               |             |                  |                    |                    |
| GPS Coordinates               | ⚪ Optional | ⚪ Optional   | ⚪ Optional | ✅               | ⚪ Optional        | ⚪ Optional        |
| Photos                        | ⚪ Optional | ⚪ Optional   | ⚪ Optional | ⚪ Optional      | ⚪ Optional        | ⚪ Optional        |
| Status/Notes                  | ⚪ Optional | ⚪ Optional   | ⚪ Optional | ⚪ Optional      | ⚪ Optional        | ⚪ Optional        |

**Legend:**

- ✅ **Required**: Deliverable cannot be generated without this data
- ⚪ **Optional**: Deliverable can be generated without this data (graceful degradation)

### 3.2 Step Requirements Per Deliverable

| Workflow Step       | GIS Export    | Permit Report | FirstEnergy   | Field Collection | Clearance Analysis | Existing Plant Doc |
| ------------------- | ------------- | ------------- | ------------- | ---------------- | ------------------ | ------------------ |
| 1. Project Setup    | ✅ Required   | ✅ Required   | ✅ Required   | ✅ Required      | ✅ Required        | ✅ Required        |
| 2. Data Intake      | ✅ Required   | ✅ Required   | ✅ Required   | ✅ Required      | ✅ Required        | ⚪ Optional        |
| 3. Existing Plant   | ⚪ Optional   | ✅ Required   | ⚪ Optional   | ⚪ Optional      | ✅ Required        | ✅ Required        |
| 4. Span & Clearance | ⚪ Optional   | ✅ Required   | ⚪ Optional   | ⚪ Optional      | ✅ Required        | ⚪ Optional        |
| 5. Field Collection | ⚪ Optional   | ⚪ Optional   | ⚪ Optional   | ✅ Required      | ⚪ Optional        | ⚪ Optional        |
| 6. Outputs          | ✅ (implicit) | ✅ (implicit) | ✅ (implicit) | ✅ (implicit)    | ✅ (implicit)      | ✅ (implicit)      |

**Notes:**

- Step 6 (Outputs) is where deliverables are generated, so it's always "active"
- Users can navigate directly to Outputs if all required prior steps are complete
- Step completion is validated dynamically based on deliverable selection

---

## 4. Workflow Engine Logic

### 4.1 Core Function Signature

```javascript
/**
 * Computes workflow requirements based on selected deliverables and current job state
 * @param {Object} config
 * @param {string[]} config.selectedDeliverables - Array of deliverable IDs
 * @param {Object} config.jobState - Current Zustand store state
 * @returns {WorkflowRequirements}
 */
function getWorkflowRequirements(config) {
  // Returns structured requirements object
}
```

### 4.2 Return Type: WorkflowRequirements

```typescript
interface WorkflowRequirements {
  // Step-level requirements
  requiredSteps: {
    projectSetup: boolean; // Step 1
    dataIntake: boolean; // Step 2
    existingPlant: boolean; // Step 3
    spanModeling: boolean; // Step 4
    fieldCollection: boolean; // Step 5
    outputs: boolean; // Step 6 (always true)
  };

  // Completion status per step
  stepCompletionStatus: {
    projectSetup: "complete" | "incomplete" | "not_required";
    dataIntake: "complete" | "incomplete" | "not_required";
    existingPlant: "complete" | "incomplete" | "not_required";
    spanModeling: "complete" | "incomplete" | "not_required";
    fieldCollection: "complete" | "incomplete" | "not_required";
    outputs: "complete" | "incomplete" | "not_required";
  };

  // Missing data per deliverable
  missingRequirements: {
    [deliverableId: string]: {
      canGenerate: boolean;
      missingFields: string[];
      warnings: string[];
    };
  };

  // Overall workflow state
  canProceedToOutputs: boolean;
  nextSuggestedStep: number | null;
  completionPercentage: number;

  // User guidance
  messages: {
    type: "error" | "warning" | "info";
    text: string;
    actionable?: boolean;
    suggestedAction?: string;
  }[];
}
```

### 4.3 Validation Rules

#### Step 1: Project Setup

**Required Data (always):**

- `projectName` (non-empty string)
- `currentJobId` (valid UUID)
- `currentSubmissionProfile` (valid profile key)

**Validation:**

```javascript
function validateProjectSetup(state) {
  const missing = [];
  if (!state.projectName?.trim()) missing.push("Project Name");
  if (!state.currentJobId) missing.push("Active Job");
  if (!state.currentSubmissionProfile) missing.push("Submission Profile");
  return {
    complete: missing.length === 0,
    missing,
  };
}
```

#### Step 2: Data Intake

**Required Data (if deliverable needs pole data):**

- At least 1 pole in `collectedPoles` OR `importedSpans`
- For GIS export: pole locations (lat/lon) required

**Validation:**

```javascript
function validateDataIntake(state, deliverables) {
  const needsPoles = deliverables.some((d) =>
    [
      "gis_export",
      "permit_report",
      "firstenergy_export",
      "field_collection",
    ].includes(d),
  );

  if (!needsPoles) return { complete: true, missing: [] };

  const hasPoles = (state.collectedPoles?.length || 0) > 0;
  const hasSpans = (state.importedSpans?.length || 0) > 0;

  if (!hasPoles && !hasSpans) {
    return {
      complete: false,
      missing: ["At least 1 pole or span"],
    };
  }

  // For GIS export, check coordinates
  if (deliverables.includes("gis_export")) {
    const polesWithCoords =
      state.collectedPoles?.filter((p) => p.latitude && p.longitude) || [];
    if (polesWithCoords.length === 0) {
      return {
        complete: false,
        missing: ["Pole coordinates (latitude/longitude)"],
      };
    }
  }

  return { complete: true, missing: [] };
}
```

#### Step 3: Existing Plant

**Required Data (if deliverable = permit_report OR clearance_analysis):**

- `existingPowerHeight` (numeric)
- `existingPowerVoltage` (valid enum)

**Validation:**

```javascript
function validateExistingPlant(state, deliverables) {
  const needsExisting = deliverables.some((d) =>
    ["permit_report", "clearance_analysis", "existing_plant_doc"].includes(d),
  );

  if (!needsExisting) return { complete: true, missing: [] };

  const missing = [];

  if (deliverables.includes("existing_plant_doc")) {
    // Requires at least 1 existing line entry
    if (!state.existingLines?.length) {
      missing.push("Existing attachments/lines");
    }
  }

  if (
    deliverables.some((d) =>
      ["permit_report", "clearance_analysis"].includes(d),
    )
  ) {
    if (!state.existingPowerHeight) missing.push("Existing Power Height");
    if (!state.existingPowerVoltage) missing.push("Existing Power Voltage");
  }

  return {
    complete: missing.length === 0,
    missing,
  };
}
```

#### Step 4: Span & Clearance

**Required Data (if deliverable = permit_report OR clearance_analysis):**

- `spanDistance` OR calculated span length from coordinates
- `spanEnvironment` (road/alley/etc)
- `proposedLineHeight` OR auto-calculated attach height

**Validation:**

```javascript
function validateSpanModeling(state, deliverables) {
  const needsSpans = deliverables.some((d) =>
    ["permit_report", "clearance_analysis"].includes(d),
  );

  if (!needsSpans) return { complete: true, missing: [] };

  const missing = [];

  // Check for span data (manual OR calculated from coordinates)
  const hasManualSpan =
    state.spanDistance && parseFloat(state.spanDistance) > 0;
  const hasCalculatedSpan = state.importedSpans?.some((s) => s.lengthFt > 0);

  if (!hasManualSpan && !hasCalculatedSpan) {
    missing.push("Span length (manual or from coordinates)");
  }

  if (!state.spanEnvironment) {
    missing.push("Span environment (road/alley/etc)");
  }

  // Proposed attach height can be auto-calculated, so only warn if missing
  if (!state.proposedLineHeight) {
    // This is not strictly required; calculations can recommend
  }

  return {
    complete: missing.length === 0,
    missing,
  };
}
```

#### Step 5: Field Collection

**Required Data (if deliverable = field_collection):**

- At least 1 pole with GPS coordinates
- Status field populated

**Validation:**

```javascript
function validateFieldCollection(state, deliverables) {
  if (!deliverables.includes("field_collection")) {
    return { complete: true, missing: [] };
  }

  const polesWithGPS =
    state.collectedPoles?.filter((p) => p.latitude && p.longitude) || [];

  if (polesWithGPS.length === 0) {
    return {
      complete: false,
      missing: ["At least 1 pole with GPS coordinates"],
    };
  }

  return { complete: true, missing: [] };
}
```

---

## 5. Preflight Validation (Export-Time)

### 5.1 GIS Export Preflight

**Function:** `validateGISExportPreflight(state)`

**Checks:**

1. ✅ At least 1 pole with valid coordinates (lat/lon)
2. ⚠️ Pole IDs/tags present (warning if missing)
3. ⚠️ Span geometry available (warning if missing)

**Return:**

```javascript
{
  canExport: true,
  errors: [],
  warnings: [
    'Some poles missing IDs - will use auto-generated identifiers',
    'No span data - export will contain points only'
  ]
}
```

### 5.2 Permit Report Preflight

**Function:** `validatePermitReportPreflight(state)`

**Checks:**

1. ✅ Job metadata complete (project name, job number, applicant)
2. ✅ Pole height and class specified
3. ✅ Existing power height and voltage specified
4. ✅ Span length available (manual or calculated)
5. ✅ Span environment specified
6. ⚠️ Proposed attach height calculated (auto-calc if missing)

**Return:**

```javascript
{
  canExport: false,
  errors: [
    'Missing required field: Job Number',
    'Missing required field: Existing Power Height'
  ],
  warnings: []
}
```

### 5.3 FirstEnergy Export Preflight

**Function:** `validateFirstEnergyExportPreflight(state)`

**Checks:**

1. ✅ Submission profile = 'firstEnergy' or FirstEnergy family
2. ✅ Job owner specified
3. ✅ Pole coordinates available
4. ✅ Pole height and proposed attach height available
5. ⚠️ Warning if coordinates outside FirstEnergy service territory

**Return:**

```javascript
{
  canExport: true,
  errors: [],
  warnings: [
    'Coordinates outside typical FirstEnergy territory - verify utility owner'
  ]
}
```

### 5.4 Field Collection Preflight

**Function:** `validateFieldCollectionPreflight(state)`

**Checks:**

1. ✅ At least 1 pole collected
2. ✅ Poles have GPS coordinates
3. ⚠️ Photos attached (warning if none)
4. ⚠️ Status field populated (warning if missing)

**Return:**

```javascript
{
  canExport: true,
  errors: [],
  warnings: [
    '3 poles missing status field',
    'No photos attached - consider adding site documentation'
  ]
}
```

---

## 6. Error Codes & Messages

### 6.1 Error Code Schema

**Format:** `ERR_<CATEGORY>_<SPECIFIC_CODE>`

| Category   | Prefix     | Description              |
| ---------- | ---------- | ------------------------ |
| Workflow   | `ERR_WF_`  | Workflow state errors    |
| Validation | `ERR_VAL_` | Data validation errors   |
| Export     | `ERR_EXP_` | Export generation errors |
| Import     | `ERR_IMP_` | Import parsing errors    |

### 6.2 Common Error Codes

| Code                     | Message                                  | User Action                                             |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------- |
| `ERR_WF_NO_PROJECT`      | No active project selected               | Create a new project in Step 1                          |
| `ERR_WF_STEP_INCOMPLETE` | Required step incomplete: {step}         | Complete {step} before proceeding                       |
| `ERR_VAL_MISSING_COORDS` | Pole coordinates required for GIS export | Import pole locations or add GPS data                   |
| `ERR_VAL_MISSING_HEIGHT` | Pole height required for permit report   | Enter pole height in Data Intake or Span Modeling       |
| `ERR_EXP_NO_DATA`        | No poles or spans to export              | Import data in Step 2                                   |
| `ERR_EXP_PREFLIGHT_FAIL` | Export preflight validation failed       | See details below                                       |
| `ERR_IMP_INVALID_CSV`    | CSV format not recognized                | Use a supported mapping preset or verify column headers |

---

## 7. UI/UX Specifications

### 7.1 Deliverable Picker (New Component)

**Location:** Step 1 (Project Setup) or App Header  
**Component Name:** `DeliverablePicker.jsx`

**UI Requirements:**

- Multi-select checkbox group
- Grouped by category: Exports, Analysis, Field Work
- Show description tooltip on hover
- "Select All" shortcut for full workflow
- Persist selection in Zustand store

**Example:**

```jsx
<DeliverablePicker
  selected={state.selectedDeliverables}
  onChange={(deliverables) => setState({ selectedDeliverables: deliverables })}
/>
```

**Visual Design:**

```
┌─ Select Your Deliverables ────────────────────────┐
│                                                    │
│ Exports                                            │
│ ☑ GIS Export (GeoJSON/KML/Shapefile)              │
│ ☑ Permit Report (PDF)                             │
│ ☐ FirstEnergy Joint Use CSV                       │
│                                                    │
│ Analysis                                           │
│ ☐ Span & Clearance Analysis                       │
│ ☐ Existing Plant Documentation                    │
│                                                    │
│ Field Work                                         │
│ ☐ Field Collection Data                           │
│                                                    │
│ [Select All for Full Workflow]                    │
└────────────────────────────────────────────────────┘
```

### 7.2 Step Navigation Enhancement

**Component:** `StepNavigation.jsx` (modify existing)

**Changes:**

- Add visual indicator for required vs optional steps
- Dim/disable optional steps that aren't selected
- Show completion percentage per step
- Add tooltip: "Optional - not required for your selected deliverables"

**Visual States:**

```
1. Project Setup       ✅ Complete (Required)
2. Data Intake         🔵 In Progress (Required)
3. Existing Plant      ⚪ Not Started (Optional)
4. Span & Clearance    ⚪ Not Started (Required)
5. Field Collection    ⚪ Not Started (Optional)
6. Outputs             ⚪ Ready
```

### 7.3 Outputs Panel Preflight UI

**Location:** Step 6 (Outputs Panel)  
**Component:** `PreflightCheckPanel.jsx` (new)

**UI Requirements:**

- Run preflight check on panel mount
- Show status per deliverable
- Expandable error/warning details
- Action buttons: "Fix in [Step Name]" → navigate to step
- Allow export if warnings only

**Example:**

```
┌─ Export Preflight Check ──────────────────────────┐
│                                                    │
│ GIS Export                          ✅ Ready       │
│ ├─ 15 poles with coordinates                      │
│ └─ ⚠️  3 poles missing IDs (will auto-generate)   │
│                                                    │
│ Permit Report                       ❌ Blocked     │
│ ├─ ❌ Missing: Job Number                         │
│ ├─ ❌ Missing: Existing Power Height              │
│ └─ [Fix in Project Setup] [Fix in Existing Plant] │
│                                                    │
│ FirstEnergy Export                  ⚪ Not Selected│
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 8. Implementation Checklist

### Phase 1: Workflow Engine (Core Logic)

- [ ] Create `/src/utils/workflowEngine.js`
  - [ ] `getWorkflowRequirements(config)` function
  - [ ] Step validation functions per deliverable
  - [ ] Completion percentage calculator
- [ ] Create `/src/utils/preflightValidation.js`
  - [ ] `validateGISExportPreflight(state)`
  - [ ] `validatePermitReportPreflight(state)`
  - [ ] `validateFirstEnergyExportPreflight(state)`
  - [ ] `validateFieldCollectionPreflight(state)`
- [ ] Add to Zustand store:
  - [ ] `selectedDeliverables: []`
  - [ ] `setSelectedDeliverables(deliverables)`
  - [ ] `workflowRequirements: null`
  - [ ] `updateWorkflowRequirements()`

### Phase 2: UI Components

- [ ] Create `/src/components/DeliverablePicker.jsx`
  - [ ] Multi-select checkbox UI
  - [ ] Grouped categories
  - [ ] Description tooltips
  - [ ] Integration with store
- [ ] Modify `/src/components/layout/StepNavigation.jsx`
  - [ ] Add required/optional visual indicators
  - [ ] Disable navigation to incomplete required steps
  - [ ] Allow skipping optional steps
  - [ ] Show completion percentage
- [ ] Create `/src/components/PreflightCheckPanel.jsx`
  - [ ] Per-deliverable validation status
  - [ ] Expandable error/warning details
  - [ ] "Fix in [Step]" navigation buttons
  - [ ] Export button enable/disable logic
- [ ] Modify `/src/components/workflow/panels/OutputsPanel.jsx`
  - [ ] Integrate PreflightCheckPanel
  - [ ] Conditional export button states
  - [ ] Per-deliverable export actions

### Phase 3: Calculation Hardening

- [ ] Modify `/src/utils/calculations.js`
  - [ ] `computeAnalysis`: Handle missing span data gracefully
  - [ ] Return structured result with warnings instead of throwing
  - [ ] Add `{ success, data, warnings, errors }` return pattern
- [ ] Modify `/src/utils/exporters.js`
  - [ ] `buildGeoJSON`: Handle missing coordinates with warnings
  - [ ] `buildPolesCSV`: Graceful degradation for optional fields
  - [ ] `buildFirstEnergyJointUseCSV`: Validate before generation
- [ ] Add defensive checks in:
  - [ ] `/src/utils/importers.js` (schema validation)
  - [ ] `/src/utils/geodata.js` (coordinate validation)
  - [ ] `/src/components/workflow/panels/*Panel.jsx` (null safety)

### Phase 4: Testing

- [ ] Unit tests: `/src/utils/__tests__/workflowEngine.test.js`
  - [ ] Test each deliverable combination
  - [ ] Test step requirement calculation
  - [ ] Test completion percentage
  - [ ] Test missing requirements detection
- [ ] Unit tests: `/src/utils/__tests__/preflightValidation.test.js`
  - [ ] Test each preflight function
  - [ ] Test error/warning generation
  - [ ] Test edge cases (empty state, partial data)
- [ ] Integration tests: `/src/utils/__tests__/workflowIntegration.test.js`
  - [ ] Test deliverable selection → requirement update flow
  - [ ] Test step navigation with partial workflow
  - [ ] Test export preflight → fix → re-validate flow
- [ ] E2E tests: `/e2e/deliverable-workflows.spec.js`
  - [ ] **Test Case 1**: GIS Export only (skip steps 3-5)
  - [ ] **Test Case 2**: Permit Report (require steps 1-4)
  - [ ] **Test Case 3**: Field Collection only (skip spans)
  - [ ] **Test Case 4**: Full workflow (all steps)

### Phase 5: Documentation

- [ ] Create `/docs/PREFLIGHT-VALIDATION.md`
- [ ] Update `/docs/USER_GUIDE.md` with deliverable selection
- [ ] Add code comments with AI: rationale
- [ ] Generate final report with evidence

---

## 9. Backward Compatibility

### 9.1 Default Behavior

If user does NOT select deliverables:

- **Default:** Select ALL deliverables
- **Behavior:** Full 6-step workflow (current behavior unchanged)
- **Migration:** Existing users see no change

### 9.2 Store Migration

Add migration logic in `store.js`:

```javascript
// Auto-migrate: if selectedDeliverables is undefined, default to all
const migrateStoreState = (state) => {
  if (!state.selectedDeliverables) {
    return {
      ...state,
      selectedDeliverables: [
        "gis_export",
        "permit_report",
        "firstenergy_export",
        "field_collection",
        "clearance_analysis",
        "existing_plant_doc",
      ],
    };
  }
  return state;
};
```

---

## 10. Success Criteria

### 10.1 Functional Requirements

- ✅ Users can select any combination of deliverables
- ✅ Required steps are computed correctly per deliverable
- ✅ Optional steps can be skipped without errors
- ✅ Preflight validation blocks incomplete exports with actionable errors
- ✅ Full workflow remains unchanged for backward compatibility

### 10.2 Quality Metrics

- ✅ Zero null reference errors in calculations (100% null-safe)
- ✅ Zero broken UI states (loading/error states resolve)
- ✅ 100% test coverage for workflow engine
- ✅ 95%+ test coverage for preflight validation
- ✅ E2E tests pass for all 4 test scenarios

### 10.3 Performance Targets

- ✅ Workflow requirement calculation < 50ms
- ✅ Preflight validation < 100ms
- ✅ No UI blocking during validation (async where possible)

---

## 11. Known Limitations & Future Work

### 11.1 Current Limitations

1. **No Multi-Job Workflows**: System assumes 1 active job at a time
2. **No Conditional Steps**: Steps are binary (required/optional), not context-dependent
3. **No Step Dependencies**: Cannot model "Step 4 requires Step 3 IF voltage = transmission"
4. **No Partial Export**: Cannot export subset of poles (all-or-nothing per deliverable)

### 11.2 Future Enhancements (Out of Scope)

- **Smart Recommendations**: "Based on your data, you can also generate [X]"
- **Template Workflows**: Save deliverable combinations as templates
- **Batch Processing**: Run multiple jobs with same deliverable config
- **Custom Deliverables**: Allow users to define custom export formats

---

## 12. Glossary

| Term                      | Definition                                                                |
| ------------------------- | ------------------------------------------------------------------------- |
| **Deliverable**           | A final output product (export, report, analysis)                         |
| **Required Step**         | A workflow step that MUST be completed for selected deliverables          |
| **Optional Step**         | A workflow step that can be skipped for selected deliverables             |
| **Preflight Check**       | Pre-export validation that checks for missing/invalid data                |
| **Graceful Degradation**  | System continues to function with reduced capability when data is missing |
| **Completion Percentage** | % of required data present for a given step                               |

---

**End of Workflow Contract**
