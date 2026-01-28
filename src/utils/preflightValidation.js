/**
 * preflightValidation.js - deliverable/export preflight checks
 *
 * Provides structured validation results for exports/imports based on
 * selected deliverables and workflow requirements.
 */
import {
  DELIVERABLE_TYPES,
  DELIVERABLE_METADATA,
  getWorkflowRequirements,
} from "./workflowEngine.js";

const STEP_LABELS = {
  projectSetup: "Project Setup",
  dataIntake: "Data Intake",
  existingPlant: "Existing Plant",
  spanModeling: "Span & Clearance",
  fieldCollection: "Field Collection",
  outputs: "Outputs",
};

const STEP_ID_MAP = {
  projectSetup: "project-setup",
  dataIntake: "data-intake",
  existingPlant: "existing-plant",
  spanModeling: "span-modeling",
  fieldCollection: "field-collection",
  outputs: "outputs",
};

const EXPORT_TYPE_TO_DELIVERABLE = {
  "poles-csv": DELIVERABLE_TYPES.GIS_EXPORT,
  "spans-csv": DELIVERABLE_TYPES.GIS_EXPORT,
  "existing-csv": DELIVERABLE_TYPES.EXISTING_PLANT_DOC,
  geojson: DELIVERABLE_TYPES.GIS_EXPORT,
  kml: DELIVERABLE_TYPES.GIS_EXPORT,
  shapefile: DELIVERABLE_TYPES.GIS_EXPORT,
  "permit-pdf": DELIVERABLE_TYPES.PERMIT_REPORT,
  "firstenergy-csv": DELIVERABLE_TYPES.FIRSTENERGY_EXPORT,
  "field-collection": DELIVERABLE_TYPES.FIELD_COLLECTION,
  "clearance-analysis": DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
};

function buildError(code, message, details = {}) {
  return {
    code,
    message,
    ...details,
  };
}

function buildWarning(code, message, details = {}) {
  return {
    code,
    message,
    ...details,
  };
}

function collectMissingSteps(workflowRequirements) {
  const missingSteps = [];
  const suggestedActions = [];

  if (!workflowRequirements?.requiredSteps)
    return { missingSteps, suggestedActions };

  Object.entries(workflowRequirements.requiredSteps).forEach(
    ([stepKey, required]) => {
      if (!required || stepKey === "outputs") return;
      const status = workflowRequirements.stepCompletionStatus?.[stepKey];
      if (status !== "complete") {
        missingSteps.push(stepKey);
        suggestedActions.push({
          step: STEP_ID_MAP[stepKey] || stepKey,
          stepLabel: STEP_LABELS[stepKey],
          action: "complete-step",
          message: `Complete ${STEP_LABELS[stepKey]} to unlock this export.`,
        });
      }
    },
  );

  return { missingSteps, suggestedActions };
}

export function validateForDeliverables(state, selectedDeliverables = []) {
  const workflowRequirements = getWorkflowRequirements({
    selectedDeliverables,
    jobState: state,
  });

  const errors = [];
  const warnings = [];

  Object.entries(workflowRequirements.missingRequirements || {}).forEach(
    ([deliverableId, info]) => {
      if (!info?.canGenerate) {
        const deliverableName =
          DELIVERABLE_METADATA?.[deliverableId]?.name || deliverableId;
        errors.push(
          buildError(
            `ERR_EXP_${String(deliverableId).toUpperCase()}`,
            `${deliverableName} is blocked by missing required fields.`,
            {
              fieldPath: "deliverables",
              examples: info?.missingFields || [],
            },
          ),
        );
      }

      if (info?.warnings?.length) {
        info.warnings.forEach((warning) => {
          warnings.push(
            buildWarning(
              `WARN_EXP_${String(deliverableId).toUpperCase()}`,
              warning,
            ),
          );
        });
      }
    },
  );

  const { missingSteps, suggestedActions } =
    collectMissingSteps(workflowRequirements);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    missingSteps,
    suggestedActions,
    workflowRequirements,
  };
}

export function validateForExportType(state, exportType) {
  const deliverable = EXPORT_TYPE_TO_DELIVERABLE[exportType];
  if (!deliverable) {
    return {
      ok: false,
      errors: [
        buildError("ERR_EXP_UNKNOWN", `Unknown export type: ${exportType}`),
      ],
      warnings: [],
      missingSteps: [],
      suggestedActions: [],
      workflowRequirements: null,
      exportType,
    };
  }

  // AI: rationale — export preflight should validate the specific deliverable.
  const result = validateForDeliverables(state, [deliverable]);
  return {
    ...result,
    exportType,
    deliverable,
  };
}

export function validateImportMapping({
  mapping,
  requiredFields = [],
  dataType,
}) {
  const missingFields = requiredFields.filter((field) => !mapping?.[field]);
  if (missingFields.length === 0) {
    return { ok: true, errors: [], warnings: [] };
  }

  return {
    ok: false,
    errors: [
      buildError(
        "ERR_IMP_MAPPING",
        `Missing required ${dataType} mapping fields: ${missingFields.join(", ")}`,
        {
          fieldPath: "mapping",
          examples: missingFields,
        },
      ),
    ],
    warnings: [],
  };
}

export function getExportDeliverable(exportType) {
  return EXPORT_TYPE_TO_DELIVERABLE[exportType] || null;
}
