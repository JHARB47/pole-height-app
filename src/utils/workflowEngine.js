/**
 * Workflow Engine - Deliverable-Based Requirements Calculator
 *
 * This module computes which workflow steps and data are required
 * based on user's selected deliverables.
 *
 * @module workflowEngine
 */

/**
 * Available deliverable types
 */
export const DELIVERABLE_TYPES = {
  GIS_EXPORT: "gis_export",
  PERMIT_REPORT: "permit_report",
  FIRSTENERGY_EXPORT: "firstenergy_export",
  FIELD_COLLECTION: "field_collection",
  CLEARANCE_ANALYSIS: "clearance_analysis",
  EXISTING_PLANT_DOC: "existing_plant_doc",
};

/**
 * Deliverable metadata for UI display
 */
export const DELIVERABLE_METADATA = {
  [DELIVERABLE_TYPES.GIS_EXPORT]: {
    id: DELIVERABLE_TYPES.GIS_EXPORT,
    name: "GIS Export",
    description: "Geospatial data export (GeoJSON/KML/Shapefile)",
    category: "exports",
    icon: "map",
  },
  [DELIVERABLE_TYPES.PERMIT_REPORT]: {
    id: DELIVERABLE_TYPES.PERMIT_REPORT,
    name: "Permit Report",
    description: "NESC compliance report (PDF)",
    category: "exports",
    icon: "file-text",
  },
  [DELIVERABLE_TYPES.FIRSTENERGY_EXPORT]: {
    id: DELIVERABLE_TYPES.FIRSTENERGY_EXPORT,
    name: "FirstEnergy Joint Use CSV",
    description: "FirstEnergy-specific manifest format",
    category: "exports",
    icon: "table",
  },
  [DELIVERABLE_TYPES.FIELD_COLLECTION]: {
    id: DELIVERABLE_TYPES.FIELD_COLLECTION,
    name: "Field Collection Data",
    description: "GPS coordinates, photos, status notes",
    category: "field_work",
    icon: "map-pin",
  },
  [DELIVERABLE_TYPES.CLEARANCE_ANALYSIS]: {
    id: DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
    name: "Span & Clearance Analysis",
    description: "Detailed midspan clearance calculations",
    category: "analysis",
    icon: "activity",
  },
  [DELIVERABLE_TYPES.EXISTING_PLANT_DOC]: {
    id: DELIVERABLE_TYPES.EXISTING_PLANT_DOC,
    name: "Existing Plant Documentation",
    description: "Attachment inventory and make-ready notes",
    category: "analysis",
    icon: "clipboard",
  },
};

/**
 * Get workflow requirements based on selected deliverables
 *
 * @param {Object} config
 * @param {string[]} config.selectedDeliverables - Array of deliverable IDs
 * @param {Object} config.jobState - Current Zustand store state
 * @returns {WorkflowRequirements}
 */
export function getWorkflowRequirements({
  selectedDeliverables = [],
  jobState = {},
}) {
  // Default to all deliverables if none selected (backward compatibility)
  const deliverables =
    selectedDeliverables.length > 0
      ? selectedDeliverables
      : Object.values(DELIVERABLE_TYPES);

  // Compute step requirements
  const requiredSteps = computeRequiredSteps(deliverables);

  // Validate each step's completion status
  const stepCompletionStatus = {
    projectSetup: validateProjectSetup(jobState).status,
    dataIntake: validateDataIntake(jobState, deliverables).status,
    existingPlant: validateExistingPlant(jobState, deliverables).status,
    spanModeling: validateSpanModeling(jobState, deliverables).status,
    fieldCollection: validateFieldCollection(jobState, deliverables).status,
    outputs: "not_required", // Always available, computed dynamically
  };

  // Check per-deliverable requirements
  const missingRequirements = {};
  for (const deliverable of deliverables) {
    missingRequirements[deliverable] = validateDeliverable(
      deliverable,
      jobState,
    );
  }

  // Determine overall workflow state
  const requiredStepKeys = Object.keys(requiredSteps).filter((key) => {
    // Exclude 'outputs' from required steps count - it's always available
    return requiredSteps[key] && key !== "outputs";
  });
  const completedRequired = requiredStepKeys.filter(
    (key) => stepCompletionStatus[key] === "complete",
  );
  const canProceedToOutputs =
    completedRequired.length === requiredStepKeys.length;

  // Compute completion percentage (only count required steps, excluding outputs)
  const completionPercentage =
    requiredStepKeys.length > 0
      ? Math.round((completedRequired.length / requiredStepKeys.length) * 100)
      : 100;

  // Determine next suggested step
  const nextSuggestedStep = getNextIncompleteStep(
    requiredSteps,
    stepCompletionStatus,
  );

  // Generate user messages
  const messages = generateWorkflowMessages({
    requiredSteps,
    stepCompletionStatus,
    missingRequirements,
    canProceedToOutputs,
  });

  return {
    requiredSteps,
    stepCompletionStatus,
    missingRequirements,
    canProceedToOutputs,
    nextSuggestedStep,
    completionPercentage,
    messages,
  };
}

/**
 * Compute which steps are required for given deliverables
 */
function computeRequiredSteps(deliverables) {
  const steps = {
    projectSetup: false,
    dataIntake: false,
    existingPlant: false,
    spanModeling: false,
    fieldCollection: false,
    outputs: true, // Always "required" (implicit)
  };

  // Step 1: Project Setup - always required
  steps.projectSetup = true;

  // Step 2: Data Intake - required if deliverable needs pole/span data
  const needsData = deliverables.some((d) =>
    [
      DELIVERABLE_TYPES.GIS_EXPORT,
      DELIVERABLE_TYPES.PERMIT_REPORT,
      DELIVERABLE_TYPES.FIRSTENERGY_EXPORT,
      DELIVERABLE_TYPES.FIELD_COLLECTION,
      DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
    ].includes(d),
  );
  steps.dataIntake = needsData;

  // Step 3: Existing Plant - required for permit reports and clearance analysis
  const needsExisting = deliverables.some((d) =>
    [
      DELIVERABLE_TYPES.PERMIT_REPORT,
      DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
      DELIVERABLE_TYPES.EXISTING_PLANT_DOC,
    ].includes(d),
  );
  steps.existingPlant = needsExisting;

  // Step 4: Span Modeling - required for permit reports and clearance analysis
  const needsSpans = deliverables.some((d) =>
    [
      DELIVERABLE_TYPES.PERMIT_REPORT,
      DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
    ].includes(d),
  );
  steps.spanModeling = needsSpans;

  // Step 5: Field Collection - required only if field collection deliverable selected
  steps.fieldCollection = deliverables.includes(
    DELIVERABLE_TYPES.FIELD_COLLECTION,
  );

  return steps;
}

/**
 * Validate Step 1: Project Setup
 */
function validateProjectSetup(state) {
  const missing = [];

  if (!state.projectName?.trim()) {
    missing.push("Project Name");
  }
  if (!state.currentJobId) {
    missing.push("Active Job");
  }
  if (!state.currentSubmissionProfile) {
    missing.push("Submission Profile");
  }

  return {
    status: missing.length === 0 ? "complete" : "incomplete",
    missing,
  };
}

/**
 * Validate Step 2: Data Intake
 */
function validateDataIntake(state, deliverables) {
  // If not required, mark as not_required
  const needsData = deliverables.some((d) =>
    [
      DELIVERABLE_TYPES.GIS_EXPORT,
      DELIVERABLE_TYPES.PERMIT_REPORT,
      DELIVERABLE_TYPES.FIRSTENERGY_EXPORT,
      DELIVERABLE_TYPES.FIELD_COLLECTION,
      DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
    ].includes(d),
  );

  if (!needsData) {
    return { status: "not_required", missing: [] };
  }

  const missing = [];

  const hasPoles = (state.collectedPoles?.length || 0) > 0;
  const hasSpans = (state.importedSpans?.length || 0) > 0;

  if (!hasPoles && !hasSpans) {
    missing.push("At least 1 pole or span");
  }

  // For GIS export or field collection, check coordinates
  const needsCoordinates = deliverables.some((d) =>
    [DELIVERABLE_TYPES.GIS_EXPORT, DELIVERABLE_TYPES.FIELD_COLLECTION].includes(
      d,
    ),
  );

  if (needsCoordinates && hasPoles) {
    const polesWithCoords =
      state.collectedPoles?.filter((p) => p.latitude && p.longitude) || [];
    if (polesWithCoords.length === 0) {
      missing.push("Pole coordinates (latitude/longitude)");
    }
  }

  return {
    status: missing.length === 0 ? "complete" : "incomplete",
    missing,
  };
}

/**
 * Validate Step 3: Existing Plant
 */
function validateExistingPlant(state, deliverables) {
  const needsExisting = deliverables.some((d) =>
    [
      DELIVERABLE_TYPES.PERMIT_REPORT,
      DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
      DELIVERABLE_TYPES.EXISTING_PLANT_DOC,
    ].includes(d),
  );

  if (!needsExisting) {
    return { status: "not_required", missing: [] };
  }

  const missing = [];

  // For existing plant documentation, require at least 1 existing line
  if (deliverables.includes(DELIVERABLE_TYPES.EXISTING_PLANT_DOC)) {
    if (!state.existingLines?.length) {
      missing.push("Existing attachments/lines");
    }
  }

  // For permit reports and clearance analysis, require power data
  if (
    deliverables.some((d) =>
      [
        DELIVERABLE_TYPES.PERMIT_REPORT,
        DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
      ].includes(d),
    )
  ) {
    if (!state.existingPowerHeight) {
      missing.push("Existing Power Height");
    }
    if (!state.existingPowerVoltage) {
      missing.push("Existing Power Voltage");
    }
  }

  return {
    status: missing.length === 0 ? "complete" : "incomplete",
    missing,
  };
}

/**
 * Validate Step 4: Span & Clearance Modeling
 */
function validateSpanModeling(state, deliverables) {
  const needsSpans = deliverables.some((d) =>
    [
      DELIVERABLE_TYPES.PERMIT_REPORT,
      DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
    ].includes(d),
  );

  if (!needsSpans) {
    return { status: "not_required", missing: [] };
  }

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

  // Proposed attach height can be auto-calculated, so it's not strictly required
  // But we'll warn if missing

  return {
    status: missing.length === 0 ? "complete" : "incomplete",
    missing,
  };
}

/**
 * Validate Step 5: Field Collection
 */
function validateFieldCollection(state, deliverables) {
  if (!deliverables.includes(DELIVERABLE_TYPES.FIELD_COLLECTION)) {
    return { status: "not_required", missing: [] };
  }

  const missing = [];

  const polesWithGPS =
    state.collectedPoles?.filter((p) => p.latitude && p.longitude) || [];

  if (polesWithGPS.length === 0) {
    missing.push("At least 1 pole with GPS coordinates");
  }

  return {
    status: missing.length === 0 ? "complete" : "incomplete",
    missing,
  };
}

/**
 * Validate specific deliverable requirements
 */
function validateDeliverable(deliverable, state) {
  const result = {
    canGenerate: true,
    missingFields: [],
    warnings: [],
  };

  switch (deliverable) {
    case DELIVERABLE_TYPES.GIS_EXPORT:
      return validateGISExportRequirements(state);
    case DELIVERABLE_TYPES.PERMIT_REPORT:
      return validatePermitReportRequirements(state);
    case DELIVERABLE_TYPES.FIRSTENERGY_EXPORT:
      return validateFirstEnergyRequirements(state);
    case DELIVERABLE_TYPES.FIELD_COLLECTION:
      return validateFieldCollectionRequirements(state);
    case DELIVERABLE_TYPES.CLEARANCE_ANALYSIS:
      return validateClearanceAnalysisRequirements(state);
    case DELIVERABLE_TYPES.EXISTING_PLANT_DOC:
      return validateExistingPlantDocRequirements(state);
    default:
      return result;
  }
}

function validateGISExportRequirements(state) {
  const missingFields = [];
  const warnings = [];

  const polesWithCoords =
    state.collectedPoles?.filter((p) => p.latitude && p.longitude) || [];

  if (polesWithCoords.length === 0) {
    missingFields.push("Pole coordinates (latitude/longitude)");
  }

  // Check for pole IDs (warning only)
  const polesWithoutIds = state.collectedPoles?.filter((p) => !p.id) || [];
  if (polesWithoutIds.length > 0) {
    warnings.push(
      `${polesWithoutIds.length} poles missing IDs - will auto-generate`,
    );
  }

  // Check for span geometry (warning only)
  if (!state.importedSpans?.length) {
    warnings.push("No span data - export will contain points only");
  }

  return {
    canGenerate: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

function validatePermitReportRequirements(state) {
  const missingFields = [];
  const warnings = [];

  // Job metadata
  if (!state.projectName?.trim()) missingFields.push("Project Name");
  if (!state.jobNumber?.trim()) missingFields.push("Job Number");
  if (!state.applicantName?.trim()) missingFields.push("Applicant Name");
  if (!state.jobOwner?.trim()) missingFields.push("Job Owner (Utility)");

  // Pole data
  if (!state.poleHeight) missingFields.push("Pole Height");
  if (!state.poleClass) missingFields.push("Pole Class");

  // Existing plant
  if (!state.existingPowerHeight) missingFields.push("Existing Power Height");
  if (!state.existingPowerVoltage) missingFields.push("Existing Power Voltage");

  // Span data
  const hasSpanLength =
    state.spanDistance || state.importedSpans?.some((s) => s.lengthFt > 0);
  if (!hasSpanLength) missingFields.push("Span Length");
  if (!state.spanEnvironment) missingFields.push("Span Environment");

  // Proposed attach height (can be auto-calculated)
  if (!state.proposedLineHeight) {
    warnings.push("Proposed attach height will be auto-calculated");
  }

  return {
    canGenerate: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

function validateFirstEnergyRequirements(state) {
  const missingFields = [];
  const warnings = [];

  // Check submission profile
  const isFEProfile =
    state.currentSubmissionProfile?.toLowerCase().includes("firstenergy") ||
    state.currentSubmissionProfile?.toLowerCase().includes("monpower");

  if (!isFEProfile) {
    warnings.push(
      "Submission profile is not FirstEnergy - verify correct profile selected",
    );
  }

  // Job owner
  if (!state.jobOwner?.trim()) missingFields.push("Job Owner (Utility)");

  // Pole data with coordinates
  const polesWithCoords =
    state.collectedPoles?.filter((p) => p.latitude && p.longitude) || [];
  if (polesWithCoords.length === 0) {
    missingFields.push("Pole coordinates");
  }

  // Pole heights
  if (!state.poleHeight) missingFields.push("Pole Height");

  // Proposed attach height
  if (!state.proposedLineHeight) {
    warnings.push("Proposed attach height will be auto-calculated");
  }

  return {
    canGenerate: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

function validateFieldCollectionRequirements(state) {
  const missingFields = [];
  const warnings = [];

  const polesWithGPS =
    state.collectedPoles?.filter((p) => p.latitude && p.longitude) || [];

  if (polesWithGPS.length === 0) {
    missingFields.push("At least 1 pole with GPS coordinates");
  }

  // Check for status field (warning)
  const polesWithoutStatus =
    state.collectedPoles?.filter((p) => !p.status) || [];
  if (polesWithoutStatus.length > 0) {
    warnings.push(`${polesWithoutStatus.length} poles missing status field`);
  }

  // Check for photos (info)
  const totalPhotos =
    state.collectedPoles?.reduce(
      (sum, p) => sum + (p.photos?.length || 0),
      0,
    ) || 0;
  if (totalPhotos === 0) {
    warnings.push("No photos attached - consider adding site documentation");
  }

  return {
    canGenerate: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

function validateClearanceAnalysisRequirements(state) {
  const missingFields = [];
  const warnings = [];

  // Existing plant
  if (!state.existingPowerHeight) missingFields.push("Existing Power Height");
  if (!state.existingPowerVoltage) missingFields.push("Existing Power Voltage");

  // Span data
  const hasSpanLength =
    state.spanDistance || state.importedSpans?.some((s) => s.lengthFt > 0);
  if (!hasSpanLength) missingFields.push("Span Length");
  if (!state.spanEnvironment) missingFields.push("Span Environment");

  // Pole height
  if (!state.poleHeight) missingFields.push("Pole Height");

  return {
    canGenerate: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

function validateExistingPlantDocRequirements(state) {
  const missingFields = [];
  const warnings = [];

  if (!state.existingLines?.length) {
    missingFields.push("At least 1 existing attachment/line");
  }

  // Check for make-ready notes (warning)
  const linesWithoutNotes =
    state.existingLines?.filter((l) => !l.makeReadyNotes) || [];
  if (linesWithoutNotes.length > 0) {
    warnings.push(`${linesWithoutNotes.length} lines missing make-ready notes`);
  }

  return {
    canGenerate: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * Get the next incomplete required step
 */
function getNextIncompleteStep(requiredSteps, completionStatus) {
  const stepOrder = [
    "projectSetup",
    "dataIntake",
    "existingPlant",
    "spanModeling",
    "fieldCollection",
  ];

  for (let i = 0; i < stepOrder.length; i++) {
    const stepKey = stepOrder[i];
    if (requiredSteps[stepKey] && completionStatus[stepKey] !== "complete") {
      return i + 1; // Return step number (1-based)
    }
  }

  return null; // All required steps complete
}

/**
 * Generate user-facing messages based on workflow state
 */
function generateWorkflowMessages({
  requiredSteps,
  stepCompletionStatus,
  missingRequirements,
  canProceedToOutputs,
}) {
  const messages = [];

  // Check for incomplete required steps
  const incompleteSteps = Object.keys(requiredSteps)
    .filter(
      (key) => requiredSteps[key] && stepCompletionStatus[key] === "incomplete",
    )
    .map((key) => {
      const stepNames = {
        projectSetup: "Project Setup",
        dataIntake: "Data Intake",
        existingPlant: "Existing Plant",
        spanModeling: "Span & Clearance",
        fieldCollection: "Field Collection",
      };
      return stepNames[key];
    });

  if (incompleteSteps.length > 0) {
    messages.push({
      type: "warning",
      text: `Complete required steps: ${incompleteSteps.join(", ")}`,
      actionable: true,
      suggestedAction: "Navigate to incomplete steps and fill required fields",
    });
  }

  // Check for blocked deliverables
  const blockedDeliverables = Object.keys(missingRequirements)
    .filter((key) => !missingRequirements[key].canGenerate)
    .map((key) => DELIVERABLE_METADATA[key]?.name || key);

  if (blockedDeliverables.length > 0) {
    messages.push({
      type: "error",
      text: `Cannot generate: ${blockedDeliverables.join(", ")}`,
      actionable: true,
      suggestedAction: "See Outputs panel for detailed requirements",
    });
  }

  // Success message
  if (canProceedToOutputs) {
    messages.push({
      type: "info",
      text: "All required steps complete - ready to generate deliverables",
      actionable: false,
    });
  }

  return messages;
}
