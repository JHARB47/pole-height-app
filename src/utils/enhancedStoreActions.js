/**
 * Enhanced Store Actions Module
 * Provides optimized batch operations and unified data management
 * To be integrated with main store.js
 */

import {
  prepareBatchPoleOperation,
  prepareBatchSpanOperation,
  mergePoles,
  DATA_SOURCES,
  OPERATION_TYPES,
} from "./dataOperations.js";
import { errorMonitor } from "./errorMonitoring.js";

/**
 * Enhanced pole management actions for Zustand store
 * Add these to your store.js configuration
 */
export const enhancedPoleActions = (set, get) => ({
  /**
   * Batch add multiple poles with validation
   * Returns summary of successful and failed operations
   */
  batchAddPoles: (poles, source = DATA_SOURCES.MANUAL_INPUT, options = {}) => {
    try {
      const { merge = false, validate = true } = options;
      const state = get();

      if (!Array.isArray(poles) || poles.length === 0) {
        return {
          success: false,
          errors: ["Invalid poles data: must be non-empty array"],
          summary: { total: 0, added: 0, failed: 0 },
        };
      }

      // Validate and normalize
      const batchResult = prepareBatchPoleOperation(poles, source);

      if (validate && batchResult.invalid.length > 0) {
        errorMonitor.logError(new Error("Batch pole validation errors"), {
          operation: "batch_add_poles",
          invalidCount: batchResult.invalid.length,
          errors: batchResult.invalid,
        });
      }

      // Merge or replace
      let updatedPoles;
      if (merge) {
        updatedPoles = mergePoles(
          [...(state.collectedPoles || []), ...(state.importedPoles || [])],
          batchResult.valid,
          "prefer-new",
        );

        // Split back into collected and imported
        const collected = updatedPoles.filter(
          (p) => p.source === DATA_SOURCES.FIELD_COLLECTION,
        );
        const imported = updatedPoles.filter(
          (p) => p.source !== DATA_SOURCES.FIELD_COLLECTION,
        );

        set({
          collectedPoles: collected,
          importedPoles: imported,
        });
      } else {
        // Determine target array based on source
        if (source === DATA_SOURCES.FIELD_COLLECTION) {
          set({
            collectedPoles: [
              ...(state.collectedPoles || []),
              ...batchResult.valid,
            ],
          });
        } else {
          set({
            importedPoles: [
              ...(state.importedPoles || []),
              ...batchResult.valid,
            ],
          });
        }
      }

      return {
        success: true,
        summary: batchResult.summary,
        invalid: batchResult.invalid,
        added: batchResult.valid.length,
      };
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "batch_add_poles",
        poleCount: poles?.length,
      });

      return {
        success: false,
        errors: [error.message],
        summary: {
          total: poles?.length || 0,
          added: 0,
          failed: poles?.length || 0,
        },
      };
    }
  },

  /**
   * Batch update multiple poles by ID
   */
  batchUpdatePoles: (updates, options = {}) => {
    try {
      const { validate: _validate = true, source: _source } = options;
      const state = get();

      if (!Array.isArray(updates) || updates.length === 0) {
        return {
          success: false,
          errors: ["Invalid updates: must be non-empty array"],
        };
      }

      // Updates should be { id, ...fields }
      const poleMap = new Map();
      [...(state.collectedPoles || []), ...(state.importedPoles || [])].forEach(
        (pole) => {
          poleMap.set(pole.id, pole);
        },
      );

      const results = { updated: 0, failed: 0, errors: [] };

      updates.forEach((update) => {
        if (!update.id) {
          results.failed++;
          results.errors.push("Update missing ID");
          return;
        }

        const existing = poleMap.get(update.id);
        if (!existing) {
          results.failed++;
          results.errors.push(`Pole not found: ${update.id}`);
          return;
        }

        const merged = {
          ...existing,
          ...update,
          updatedAt: new Date().toISOString(),
        };

        poleMap.set(update.id, merged);
        results.updated++;
      });

      // Split updated poles back into arrays
      const allPoles = Array.from(poleMap.values());
      const collected = allPoles.filter(
        (p) => p.source === DATA_SOURCES.FIELD_COLLECTION,
      );
      const imported = allPoles.filter(
        (p) => p.source !== DATA_SOURCES.FIELD_COLLECTION,
      );

      set({
        collectedPoles: collected,
        importedPoles: imported,
      });

      return {
        success: true,
        ...results,
      };
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "batch_update_poles",
        updateCount: updates?.length,
      });

      return {
        success: false,
        errors: [error.message],
      };
    }
  },

  /**
   * Batch add/update spans with validation
   */
  batchAddSpans: (spans, source = DATA_SOURCES.MANUAL_INPUT, options = {}) => {
    try {
      const { validate = true } = options;
      const state = get();

      const batchResult = prepareBatchSpanOperation(spans, source);

      if (validate && batchResult.invalid.length > 0) {
        errorMonitor.logError(new Error("Batch span validation errors"), {
          operation: "batch_add_spans",
          invalidCount: batchResult.invalid.length,
        });
      }

      set({
        importedSpans: [...(state.importedSpans || []), ...batchResult.valid],
      });

      return {
        success: true,
        summary: batchResult.summary,
        invalid: batchResult.invalid,
        added: batchResult.valid.length,
      };
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "batch_add_spans",
        spanCount: spans?.length,
      });

      return {
        success: false,
        errors: [error.message],
      };
    }
  },

  /**
   * Smart merge: Combine imported data with existing field collection
   * Preserves field-collected data while adding new imported poles
   */
  smartMergeData: (importedData, options = {}) => {
    try {
      const { preferField = true } = options;
      const state = get();

      const { poles = [], spans = [] } = importedData;

      // Merge poles
      const allPoles = [
        ...(state.collectedPoles || []),
        ...(state.importedPoles || []),
      ];

      const mergedPoles = mergePoles(
        allPoles,
        poles,
        preferField ? "prefer-field" : "prefer-new",
      );

      // Split merged poles
      const collected = mergedPoles.filter(
        (p) => p.source === DATA_SOURCES.FIELD_COLLECTION,
      );
      const imported = mergedPoles.filter(
        (p) => p.source !== DATA_SOURCES.FIELD_COLLECTION,
      );

      // Merge spans (simple concatenation with deduplication by ID)
      const spanMap = new Map();
      [...(state.importedSpans || []), ...spans].forEach((span) => {
        if (!spanMap.has(span.id)) {
          spanMap.set(span.id, span);
        }
      });

      set({
        collectedPoles: collected,
        importedPoles: imported,
        importedSpans: Array.from(spanMap.values()),
      });

      return {
        success: true,
        merged: {
          poles: mergedPoles.length,
          spans: spanMap.size,
        },
      };
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "smart_merge_data",
      });

      return {
        success: false,
        errors: [error.message],
      };
    }
  },

  /**
   * Get unified pole data (combined from all sources)
   */
  getAllPoles: () => {
    const state = get();
    return [...(state.collectedPoles || []), ...(state.importedPoles || [])];
  },

  /**
   * Find pole by ID across all sources
   */
  findPoleById: (poleId) => {
    const state = get();
    const allPoles = [
      ...(state.collectedPoles || []),
      ...(state.importedPoles || []),
    ];
    return allPoles.find((p) => p.id === poleId);
  },

  /**
   * Filter poles by criteria
   */
  filterPoles: (criteria) => {
    const state = get();
    const allPoles = [
      ...(state.collectedPoles || []),
      ...(state.importedPoles || []),
    ];

    return allPoles.filter((pole) => {
      if (criteria.source && pole.source !== criteria.source) return false;
      if (criteria.status && pole.status !== criteria.status) return false;
      if (criteria.jobId && pole.jobId !== criteria.jobId) return false;
      if (criteria.hasGPS && (!pole.latitude || !pole.longitude)) return false;
      return true;
    });
  },

  /**
   * Get data statistics
   */
  getDataStats: () => {
    const state = get();
    const allPoles = [
      ...(state.collectedPoles || []),
      ...(state.importedPoles || []),
    ];

    return {
      poles: {
        total: allPoles.length,
        bySource: {
          fieldCollection: allPoles.filter(
            (p) => p.source === DATA_SOURCES.FIELD_COLLECTION,
          ).length,
          manualInput: allPoles.filter(
            (p) => p.source === DATA_SOURCES.MANUAL_INPUT,
          ).length,
          csvImport: allPoles.filter(
            (p) => p.source === DATA_SOURCES.CSV_IMPORT,
          ).length,
          gisImport: allPoles.filter(
            (p) => p.source === DATA_SOURCES.GIS_IMPORT,
          ).length,
        },
        byStatus: {
          pending: allPoles.filter((p) => p.status === "pending").length,
          done: allPoles.filter((p) => p.status === "done").length,
        },
        withGPS: allPoles.filter((p) => p.latitude && p.longitude).length,
        withPhotos: allPoles.filter((p) => (p.photos || []).length > 0).length,
      },
      spans: {
        total: (state.importedSpans || []).length,
        withEndpoints: (state.importedSpans || []).filter(
          (s) => s.fromId && s.toId,
        ).length,
      },
      jobs: {
        total: (state.jobs || []).length,
        current: state.currentJobId || null,
      },
    };
  },

  /**
   * Clear all data (with confirmation)
   */
  clearAllData: (confirm = false) => {
    if (!confirm) {
      return {
        success: false,
        errors: ["Confirmation required to clear all data"],
      };
    }

    set({
      collectedPoles: [],
      importedPoles: [],
      importedSpans: [],
      existingLines: [
        {
          type: "",
          height: "",
          makeReady: false,
          makeReadyHeight: "",
          companyName: "",
        },
      ],
    });

    return {
      success: true,
      message: "All data cleared",
    };
  },
});

/**
 * Performance monitoring for batch operations
 */
export function monitorBatchOperation(operationType, itemCount, fn) {
  const startTime = performance.now();

  try {
    const result = fn();
    const duration = performance.now() - startTime;

    // Log performance metrics
    if (duration > 1000) {
      // Warn if operation takes > 1 second
      console.warn(
        `Slow batch operation: ${operationType} (${itemCount} items, ${duration.toFixed(2)}ms)`,
      );
    }

    errorMonitor.logPerformance({
      operation: operationType,
      itemCount,
      duration,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    errorMonitor.logError(error, {
      operation: operationType,
      itemCount,
      duration,
    });
    throw error;
  }
}

/**
 * Span-specific enhanced actions
 * Separated for clarity but extends pole actions
 */
// eslint-disable-next-line no-unused-vars
export const enhancedSpanActions = (_set, _get) => ({
  // Span actions are already included in enhancedPoleActions
  // This export exists for API consistency
});
