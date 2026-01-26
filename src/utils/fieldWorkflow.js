/**
 * Field Workflow Orchestration
 * Coordinates field collection, offline sync, and data validation
 * Provides unified interface for field data operations
 */

import {
  normalizePoleData,
  validateAndNormalizePole,
  DATA_SOURCES,
  smartMergeFieldUpdate,
} from "./dataOperations.js";
import { errorMonitor } from "./errorMonitoring.js";

/**
 * Field workflow states
 */
export const FIELD_STATES = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  PENDING_SYNC: "pending_sync",
  SYNCED: "synced",
  ERROR: "error",
};

/**
 * Field collection manager - handles offline-first field data
 */
export class FieldCollectionManager {
  constructor(store) {
    this.store = store;
    this.pendingQueue = []; // Offline queue
    this.syncInProgress = false;
  }

  /**
   * Add new pole from field collection with GPS
   */
  async addFieldPole(poleData, options = {}) {
    try {
      const { captureGPS = true, autoValidate = true } = options;

      // Capture GPS if requested and available
      let coordinates = {
        latitude: poleData.latitude,
        longitude: poleData.longitude,
      };

      if (captureGPS && !poleData.latitude) {
        coordinates = await this.captureGPSCoordinates();
      }

      // Prepare pole data
      const rawPole = {
        ...poleData,
        ...coordinates,
        source: DATA_SOURCES.FIELD_COLLECTION,
        status: "pending",
        fieldCapturedAt: new Date().toISOString(),
      };

      // Validate if requested
      if (autoValidate) {
        const validation = validateAndNormalizePole(
          rawPole,
          DATA_SOURCES.FIELD_COLLECTION,
        );

        if (!validation.valid && !options.allowInvalid) {
          return {
            success: false,
            errors: validation.errors,
            pole: validation.data,
          };
        }

        // Add to store
        this.store.getState().addCollectedPole(validation.data);

        // Add to sync queue if offline
        if (!navigator.onLine) {
          this.addToSyncQueue({
            action: "add_pole",
            pole: validation.data,
          });
        }

        return {
          success: true,
          pole: validation.data,
          warnings: validation.valid ? [] : validation.errors,
        };
      }

      // Add without validation
      const normalized = normalizePoleData(
        rawPole,
        DATA_SOURCES.FIELD_COLLECTION,
      );
      this.store.getState().addCollectedPole(normalized);

      return {
        success: true,
        pole: normalized,
      };
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "field_add_pole",
        poleData,
      });

      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Update field pole with partial data (e.g., status change, photo added)
   */
  updateFieldPole(poleId, updates, options = {}) {
    try {
      const { smartMerge = true } = options;
      const state = this.store.getState();
      const poles = state.collectedPoles || [];
      const index = poles.findIndex((p) => p.id === poleId);

      if (index === -1) {
        return {
          success: false,
          errors: [`Pole not found: ${poleId}`],
        };
      }

      const original = poles[index];
      const merged = smartMerge
        ? smartMergeFieldUpdate(original, updates)
        : { ...original, ...updates, updatedAt: new Date().toISOString() };

      state.updateCollectedPole(index, merged);

      // Add to sync queue if offline
      if (!navigator.onLine) {
        this.addToSyncQueue({
          action: "update_pole",
          poleId,
          updates: merged,
        });
      }

      return {
        success: true,
        pole: merged,
      };
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "field_update_pole",
        poleId,
        updates,
      });

      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Mark pole as complete in field collection
   */
  markPoleComplete(poleId, completionData = {}) {
    return this.updateFieldPole(poleId, {
      status: "done",
      completedAt: new Date().toISOString(),
      ...completionData,
    });
  }

  /**
   * Batch mark multiple poles as complete
   */
  batchMarkComplete(poleIds) {
    const results = poleIds.map((id) => this.markPoleComplete(id));
    return {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Attach photo to pole
   */
  async attachPhoto(poleId, photoData) {
    try {
      const state = this.store.getState();
      const poles = state.collectedPoles || [];
      const pole = poles.find((p) => p.id === poleId);

      if (!pole) {
        return {
          success: false,
          errors: [`Pole not found: ${poleId}`],
        };
      }

      const photos = pole.photos || [];
      const newPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url: photoData.url || photoData.dataUrl,
        dataUrl: photoData.dataUrl,
        caption: photoData.caption || "",
        capturedAt: new Date().toISOString(),
        type: photoData.type || "pole_tag", // pole_tag | attachment | damage | overview
      };

      return this.updateFieldPole(poleId, {
        photos: [...photos, newPhoto],
      });
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "field_attach_photo",
        poleId,
      });

      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Capture GPS coordinates using browser Geolocation API
   */
  async captureGPSCoordinates(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      const {
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 0,
      } = options;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            capturedAt: new Date(position.timestamp).toISOString(),
          });
        },
        (error) => {
          errorMonitor.logError(error, {
            operation: "gps_capture",
            errorCode: error.code,
          });
          reject(error);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        },
      );
    });
  }

  /**
   * Add operation to offline sync queue
   */
  addToSyncQueue(operation) {
    this.pendingQueue.push({
      ...operation,
      queuedAt: new Date().toISOString(),
    });

    // Persist queue to localStorage
    try {
      localStorage.setItem(
        "field-sync-queue",
        JSON.stringify(this.pendingQueue),
      );
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "persist_sync_queue",
      });
    }
  }

  /**
   * Load pending operations from localStorage
   */
  loadSyncQueue() {
    try {
      const stored = localStorage.getItem("field-sync-queue");
      if (stored) {
        this.pendingQueue = JSON.parse(stored);
      }
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "load_sync_queue",
      });
      this.pendingQueue = [];
    }
  }

  /**
   * Sync pending operations when back online
   */
  async syncPendingOperations() {
    if (this.syncInProgress || this.pendingQueue.length === 0) {
      return {
        success: true,
        synced: 0,
      };
    }

    this.syncInProgress = true;

    try {
      const results = [];

      for (const operation of this.pendingQueue) {
        try {
          // Process each operation
          if (operation.action === "add_pole") {
            // Already in store, just mark as synced
            this.updateFieldPole(operation.pole.id, {
              syncStatus: FIELD_STATES.SYNCED,
              syncedAt: new Date().toISOString(),
            });
          } else if (operation.action === "update_pole") {
            // Update already applied locally
            this.updateFieldPole(operation.poleId, {
              syncStatus: FIELD_STATES.SYNCED,
              syncedAt: new Date().toISOString(),
            });
          }

          results.push({ success: true, operation });
        } catch (error) {
          results.push({ success: false, operation, error: error.message });
        }
      }

      // Clear synced operations
      const failed = results.filter((r) => !r.success);
      this.pendingQueue = failed.map((r) => r.operation);

      // Update localStorage
      try {
        localStorage.setItem(
          "field-sync-queue",
          JSON.stringify(this.pendingQueue),
        );
      } catch (error) {
        errorMonitor.logError(error, {
          operation: "persist_sync_queue_after_sync",
        });
      }

      return {
        success: true,
        synced: results.filter((r) => r.success).length,
        failed: failed.length,
      };
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "sync_pending_operations",
      });

      return {
        success: false,
        errors: [error.message],
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get field collection statistics
   */
  getFieldStats() {
    const state = this.store.getState();
    const poles = state.collectedPoles || [];

    return {
      total: poles.length,
      pending: poles.filter((p) => p.status === "pending").length,
      done: poles.filter((p) => p.status === "done").length,
      withPhotos: poles.filter((p) => (p.photos || []).length > 0).length,
      withGPS: poles.filter((p) => p.latitude && p.longitude).length,
      pendingSync: this.pendingQueue.length,
      lastUpdated:
        poles.length > 0
          ? Math.max(...poles.map((p) => new Date(p.updatedAt).getTime()))
          : null,
    };
  }

  /**
   * Export field data for offline backup
   */
  exportFieldData() {
    const state = this.store.getState();
    return {
      poles: state.collectedPoles || [],
      pendingQueue: this.pendingQueue,
      exportedAt: new Date().toISOString(),
      stats: this.getFieldStats(),
    };
  }

  /**
   * Import field data from backup
   */
  importFieldData(data) {
    try {
      if (!data || !Array.isArray(data.poles)) {
        return {
          success: false,
          errors: ["Invalid field data format"],
        };
      }

      const state = this.store.getState();

      // Merge poles (prefer existing field data)
      const merged = this.mergePoles(state.collectedPoles || [], data.poles);

      state.setCollectedPoles(merged);

      // Restore pending queue
      if (Array.isArray(data.pendingQueue)) {
        this.pendingQueue = data.pendingQueue;
        localStorage.setItem(
          "field-sync-queue",
          JSON.stringify(this.pendingQueue),
        );
      }

      return {
        success: true,
        imported: data.poles.length,
        merged: merged.length,
      };
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "import_field_data",
      });

      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Simple pole merge by ID
   */
  mergePoles(existing, imported) {
    const map = new Map();

    existing.forEach((pole) => map.set(pole.id, pole));

    imported.forEach((pole) => {
      const current = map.get(pole.id);
      if (!current || new Date(pole.updatedAt) > new Date(current.updatedAt)) {
        map.set(pole.id, pole);
      }
    });

    return Array.from(map.values());
  }
}

/**
 * Create field workflow manager instance
 */
export function createFieldWorkflow(store) {
  const manager = new FieldCollectionManager(store);

  // Load pending sync queue on initialization
  manager.loadSyncQueue();

  // Auto-sync when coming back online
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      manager.syncPendingOperations();
    });
  }

  return manager;
}
