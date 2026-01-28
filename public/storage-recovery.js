/**
 * Storage Recovery Script
 * This script runs BEFORE React initializes to ensure clean storage state
 * Place this script tag in index.html BEFORE the main app script
 */

(function () {
  "use strict";

  const STORE_KEY = "pole-height-store";
  const DEBUG = true;

  /**
   * @typedef {string | number | boolean | null | undefined | Array<*> | Object<string, *>} LogValue
   */

  /**
   * Logs a debug message to the console if DEBUG is enabled
   * @param {string} message - The message to log
   * @param {...LogValue} args - Additional arguments to log
   * @returns {void}
   */
  function log(message, ...args) {
    if (DEBUG) {
      console.log(`[StorageRecovery] ${message}`, ...args);
    }
  }

  /**
   * Logs an error message to the console
   * @param {string} message - The error message to log
   * @param {...LogValue} args - Additional arguments to log
   * @returns {void}
   */
  function error(message, ...args) {
    console.error(`[StorageRecovery] ${message}`, ...args);
  }

  /**
   * @typedef {Object} ClearStorageResult
   * @property {boolean} success - Whether the storage was cleared successfully
   */

  /**
   * Clears the application storage and any related keys
   * @param {string} reason - The reason for clearing storage
   * @returns {boolean} True if storage was cleared successfully, false otherwise
   */
  function clearStorage(reason) {
    error(`Clearing storage: ${reason}`);
    try {
      localStorage.removeItem(STORE_KEY);

      // Clear any related keys
      /** @type {string[]} */
      const relatedKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("pole-height") || key.includes("zustand"))) {
          relatedKeys.push(key);
        }
      }

      relatedKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
          log(`Removed related key: ${key}`);
        } catch (e) {
          error(
            `Failed to remove key ${key}:`,
            e instanceof Error ? e.message : String(e),
          );
        }
      });

      return true;
    } catch (e) {
      error(
        "Failed to clear storage:",
        e instanceof Error ? e.message : String(e),
      );
      return false;
    }
  }

  function validateStorage() {
    log("Starting storage validation...");

    // Check if localStorage is available
    try {
      localStorage.setItem("__test__", "1");
      localStorage.removeItem("__test__");
    } catch (e) {
      error(
        "localStorage is not available:",
        e instanceof Error ? e.message : String(e),
      );
      return false;
    }

    // Check the store
    try {
      const raw = localStorage.getItem(STORE_KEY);

      if (!raw) {
        log("No stored data found - fresh start");
        return true;
      }

      if (typeof raw !== "string") {
        return clearStorage("Invalid data type");
      }

      // Parse JSON
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        return clearStorage(
          `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      // Validate zustand persist format
      if (!parsed || typeof parsed !== "object") {
        return clearStorage("Parsed data is not an object");
      }

      if (!parsed.state || typeof parsed.state !== "object") {
        return clearStorage("Missing or invalid state property");
      }

      // Validate critical state properties
      const state = parsed.state;
      const requiredProps = ["poleHeight", "existingLines", "projectName"];
      const missingProps = requiredProps.filter((prop) => !(prop in state));

      if (missingProps.length > 0) {
        log(`Warning: Missing properties: ${missingProps.join(", ")}`);
        // Don't clear, just warn - these might be new properties
      }

      // Check for circular references or other issues
      try {
        JSON.stringify(parsed);
      } catch (e) {
        return clearStorage(
          `State cannot be serialized: ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      log("Storage validation passed");
      return true;
    } catch (e) {
      error(
        "Unexpected validation error:",
        e instanceof Error ? e.message : String(e),
      );
      return clearStorage(
        `Validation error: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  // Run validation
  const isValid = validateStorage();

  if (isValid) {
    log("Storage is clean and ready");
  } else {
    error("Storage validation failed - app will start with fresh state");
  }

  // Expose cleanup function for manual recovery
  // @ts-ignore - Custom property for manual storage recovery
  window.__clearAppStorage = function () {
    const cleared = clearStorage("Manual clear requested");
    if (cleared) {
      alert("Storage cleared successfully! Reloading page...");
      window.location.reload();
    } else {
      alert(
        "Failed to clear storage. Please try clearing browser data manually.",
      );
    }
  };

  log("Storage recovery script initialized");
})();
