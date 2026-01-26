/**
 * Unified Data Operations Layer
 * Provides consistent interface for all data manipulation (field collection, manual input, imports)
 * Handles validation, normalization, and batch operations
 */

import { PoleSchema, SpanSchema } from "./validation.js";

/**
 * Data operation types for telemetry and undo/redo
 */
export const OPERATION_TYPES = {
  ADD_POLE: "ADD_POLE",
  UPDATE_POLE: "UPDATE_POLE",
  DELETE_POLE: "DELETE_POLE",
  BATCH_ADD_POLES: "BATCH_ADD_POLES",
  BATCH_UPDATE_POLES: "BATCH_UPDATE_POLES",
  ADD_SPAN: "ADD_SPAN",
  UPDATE_SPAN: "UPDATE_SPAN",
  DELETE_SPAN: "DELETE_SPAN",
  BATCH_ADD_SPANS: "BATCH_ADD_SPANS",
  BATCH_UPDATE_SPANS: "BATCH_UPDATE_SPANS",
  MERGE_DATA: "MERGE_DATA",
};

/**
 * Pole data sources for tracking provenance
 */
export const DATA_SOURCES = {
  FIELD_COLLECTION: "field_collection",
  MANUAL_INPUT: "manual_input",
  CSV_IMPORT: "csv_import",
  GIS_IMPORT: "gis_import",
  API_SYNC: "api_sync",
};

/**
 * Normalize pole data to consistent internal format
 * Handles various input formats from field collection, imports, and manual entry
 */
export function normalizePoleData(rawPole, source = DATA_SOURCES.MANUAL_INPUT) {
  const normalized = {
    // Core identifiers
    id:
      rawPole.id ||
      rawPole.poleId ||
      `pole-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

    // Source tracking
    source,
    createdAt: rawPole.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // Geospatial
    latitude: parseCoordinate(rawPole.latitude),
    longitude: parseCoordinate(rawPole.longitude),

    // Physical attributes
    height: parseHeight(rawPole.height),
    class: rawPole.class || rawPole.poleClass || "",

    // Power infrastructure
    powerHeight: parseHeight(
      rawPole.powerHeight || rawPole.existingPowerHeight,
    ),
    voltage: rawPole.voltage || rawPole.existingPowerVoltage || "distribution",
    hasTransformer: Boolean(rawPole.hasTransformer),

    // Field collection specific
    status: rawPole.status || "pending", // pending | done | reviewed
    photos: Array.isArray(rawPole.photos) ? rawPole.photos : [],
    notes: rawPole.notes || "",

    // Job context
    jobId: rawPole.jobId || "",

    // Planned vs as-built
    asBuilt: {
      attachHeight: parseHeight(rawPole.asBuilt?.attachHeight),
      powerHeight: parseHeight(rawPole.asBuilt?.powerHeight),
      ...(rawPole.asBuilt || {}),
    },

    // Engineering data
    incomingBearingDeg: parseBearing(rawPole.incomingBearingDeg),
    outgoingBearingDeg: parseBearing(rawPole.outgoingBearingDeg),
    PULL_ft: parseNumeric(rawPole.PULL_ft),

    // Preserve any custom fields
    ...Object.keys(rawPole)
      .filter((key) => !RESERVED_POLE_FIELDS.has(key))
      .reduce((acc, key) => {
        acc[key] = rawPole[key];
        return acc;
      }, {}),
  };

  return normalized;
}

const RESERVED_POLE_FIELDS = new Set([
  "id",
  "poleId",
  "source",
  "createdAt",
  "updatedAt",
  "latitude",
  "longitude",
  "height",
  "class",
  "poleClass",
  "powerHeight",
  "voltage",
  "hasTransformer",
  "status",
  "photos",
  "notes",
  "jobId",
  "asBuilt",
  "incomingBearingDeg",
  "outgoingBearingDeg",
  "PULL_ft",
]);

/**
 * Normalize span data to consistent internal format
 */
export function normalizeSpanData(rawSpan, source = DATA_SOURCES.MANUAL_INPUT) {
  return {
    id:
      rawSpan.id ||
      `span-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source,
    createdAt: rawSpan.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // Endpoints
    fromId: rawSpan.fromId || rawSpan.from_id || "",
    toId: rawSpan.toId || rawSpan.to_id || "",

    // Measurements
    length: parseNumeric(rawSpan.length || rawSpan.lengthFt),
    lengthFt: parseNumeric(rawSpan.lengthFt || rawSpan.length),

    // Proposed attachment
    proposedAttach: parseHeight(rawSpan.proposedAttach),

    // Environment
    environment: rawSpan.environment || "road",
    segments: Array.isArray(rawSpan.segments) ? rawSpan.segments : [],

    // Engineering data
    incomingBearingDeg: parseBearing(rawSpan.incomingBearingDeg),
    outgoingBearingDeg: parseBearing(rawSpan.outgoingBearDeg),
    PULL_ft: parseNumeric(rawSpan.PULL_ft),

    // Job context
    jobId: rawSpan.jobId || "",

    // Preserve custom fields
    ...Object.keys(rawSpan)
      .filter((key) => !RESERVED_SPAN_FIELDS.has(key))
      .reduce((acc, key) => {
        acc[key] = rawSpan[key];
        return acc;
      }, {}),
  };
}

const RESERVED_SPAN_FIELDS = new Set([
  "id",
  "source",
  "createdAt",
  "updatedAt",
  "fromId",
  "from_id",
  "toId",
  "to_id",
  "length",
  "lengthFt",
  "proposedAttach",
  "environment",
  "segments",
  "incomingBearingDeg",
  "outgoingBearingDeg",
  "PULL_ft",
  "jobId",
]);

/**
 * Validate and normalize pole data with Zod schema
 */
export function validateAndNormalizePole(rawPole, source) {
  const normalized = normalizePoleData(rawPole, source);
  const result = PoleSchema.safeParse(normalized);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((i) => i.message),
      data: normalized, // Return normalized anyway for partial saves
    };
  }

  return {
    valid: true,
    errors: [],
    data: result.data,
  };
}

/**
 * Validate and normalize span data with Zod schema
 */
export function validateAndNormalizeSpan(rawSpan, source) {
  const normalized = normalizeSpanData(rawSpan, source);
  const result = SpanSchema.safeParse(normalized);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((i) => i.message),
      data: normalized,
    };
  }

  return {
    valid: true,
    errors: [],
    data: result.data,
  };
}

/**
 * Batch operation for adding/updating poles with validation
 */
export function prepareBatchPoleOperation(poles, source) {
  const validated = poles.map((pole) => validateAndNormalizePole(pole, source));

  return {
    valid: validated.filter((v) => v.valid).map((v) => v.data),
    invalid: validated
      .filter((v) => !v.valid)
      .map((v, idx) => ({
        index: idx,
        pole: poles[idx],
        errors: v.errors,
      })),
    summary: {
      total: poles.length,
      validCount: validated.filter((v) => v.valid).length,
      invalidCount: validated.filter((v) => !v.valid).length,
    },
  };
}

/**
 * Batch operation for adding/updating spans with validation
 */
export function prepareBatchSpanOperation(spans, source) {
  const validated = spans.map((span) => validateAndNormalizeSpan(span, source));

  return {
    valid: validated.filter((v) => v.valid).map((v) => v.data),
    invalid: validated
      .filter((v) => !v.valid)
      .map((v, idx) => ({
        index: idx,
        span: spans[idx],
        errors: v.errors,
      })),
    summary: {
      total: spans.length,
      validCount: validated.filter((v) => v.valid).length,
      invalidCount: validated.filter((v) => !v.valid).length,
    },
  };
}

/**
 * Merge poles from different sources, handling duplicates
 * Strategy: Prefer field_collection > manual_input > imports
 */
export function mergePoles(
  existingPoles = [],
  newPoles = [],
  strategy = "prefer-field",
) {
  const poleMap = new Map();

  // Add existing poles first
  existingPoles.forEach((pole) => {
    poleMap.set(pole.id, pole);
  });

  // Merge new poles
  newPoles.forEach((newPole) => {
    const existing = poleMap.get(newPole.id);

    if (!existing) {
      poleMap.set(newPole.id, newPole);
      return;
    }

    // Merge strategy
    if (strategy === "prefer-field") {
      // Field collection data takes precedence
      if (newPole.source === DATA_SOURCES.FIELD_COLLECTION) {
        poleMap.set(newPole.id, {
          ...existing,
          ...newPole,
          updatedAt: new Date().toISOString(),
        });
      } else if (existing.source === DATA_SOURCES.FIELD_COLLECTION) {
        // Keep existing field data, merge non-conflicting fields
        poleMap.set(newPole.id, {
          ...newPole,
          ...existing,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Neither is field data, use newer
        poleMap.set(newPole.id, {
          ...existing,
          ...newPole,
          updatedAt: new Date().toISOString(),
        });
      }
    } else if (strategy === "prefer-new") {
      poleMap.set(newPole.id, {
        ...existing,
        ...newPole,
        updatedAt: new Date().toISOString(),
      });
    } else if (strategy === "prefer-existing") {
      poleMap.set(newPole.id, {
        ...newPole,
        ...existing,
        updatedAt: new Date().toISOString(),
      });
    }
  });

  return Array.from(poleMap.values());
}

/**
 * Helper: Parse coordinate value
 */
function parseCoordinate(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * Helper: Parse height value (handles feet-inches, numeric)
 */
function parseHeight(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return String(value);
  return String(value);
}

/**
 * Helper: Parse bearing (0-360 degrees)
 */
function parseBearing(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;
  return Math.max(0, Math.min(360, num));
}

/**
 * Helper: Parse numeric value
 */
function parseNumeric(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

/**
 * Create operation history entry for undo/redo
 */
export function createOperationHistory(type, data, metadata = {}) {
  return {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    data,
    metadata,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Smart merge for field updates - preserves user edits
 */
export function smartMergeFieldUpdate(original, updates) {
  const merged = { ...original };

  // Fields that should always update
  const alwaysUpdate = ["status", "updatedAt", "photos", "notes"];

  // Fields that only update if original was empty
  const updateIfEmpty = ["height", "class", "powerHeight"];

  Object.keys(updates).forEach((key) => {
    if (alwaysUpdate.includes(key)) {
      merged[key] = updates[key];
    } else if (updateIfEmpty.includes(key)) {
      if (!original[key] || original[key] === "") {
        merged[key] = updates[key];
      }
    } else {
      merged[key] = updates[key];
    }
  });

  merged.updatedAt = new Date().toISOString();

  return merged;
}
