import React, { useState } from "react";
import useAppStore from "../utils/store";
import PreflightCheckPanel from "./PreflightCheckPanel";
import { Button } from "./ui";
import {
  MAPPING_PRESETS,
  importGeospatialFile,
  mapGeoJSONToAppData,
  normalizeGeoJSON,
  parseExistingLinesCSV,
  parsePolesCSVValidated,
  parseSpansCSVValidated,
} from "../utils/importers";
import { validateImportMapping } from "../utils/preflightValidation";
import { applyImportBatch } from "../utils/importBatch";
import {
  DATA_SOURCES,
  normalizePoleData,
  normalizeSpanData,
} from "../utils/dataOperations";
import { DELIVERABLE_TYPES } from "../utils/workflowEngine";
import Papa from "papaparse";
import {
  logImportStarted,
  logImportCompleted,
  logImportError,
} from "../utils/telemetry";

// Lazy load the import functionality
const loadImportFunctions = () => import("../utils/importers");

function ImportPanelLoading() {
  return (
    <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-sm text-gray-600">
        Loading import tools...
      </span>
    </div>
  );
}

export default function LazyImportPanel({ onImport, children, preflight }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async (importData) => {
    setIsLoading(true);
    const startTime = performance.now();
    logImportStarted({
      format: importData?.format || "unknown",
      fileSize: importData?.fileSize,
      mappingMode: importData?.mappingMode,
    });
    try {
      if (preflight) {
        const preflightResult = preflight(importData);
        if (preflightResult?.ok === false) {
          logImportError({
            format: importData?.format || "unknown",
            errorType: "preflight_failed",
            fileSize: importData?.fileSize,
            rowCount: importData?.rowCount,
            mappingMode: importData?.mappingMode,
          });
          return preflightResult;
        }
      }
      const importUtils = await loadImportFunctions();
      const result = await onImport(importData, importUtils);
      logImportCompleted({
        format: importData?.format || "unknown",
        rowCount: result?.rowCount,
        durationMs: performance.now() - startTime,
      });
      return result;
    } catch (error) {
      console.error("Error loading import functionality:", error);
      logImportError({
        format: importData?.format || "unknown",
        errorType: error?.message || "import_failed",
        fileSize: importData?.fileSize,
        rowCount: importData?.rowCount,
        mappingMode: importData?.mappingMode,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <ImportPanelLoading />;
  }

  if (typeof children !== "function") {
    return <DefaultImportPanel />;
  }

  return children({ onImport: handleImport, isLoading });
}

const MAX_FILE_MB = 25;
const PARSE_TIMEOUT_MS = 15000;

function DefaultImportPanel() {
  const { selectedDeliverables, currentJobId } = useAppStore((s) => ({
    selectedDeliverables: s.selectedDeliverables || [],
    currentJobId: s.currentJobId,
  }));
  const [mode, setMode] = useState("geospatial");
  const [csvType, setCsvType] = useState("poles");
  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [status, setStatus] = useState("");
  const [preflightResult, setPreflightResult] = useState(null);
  const [mappingPreset, setMappingPreset] = useState("generic");
  const [mapping, setMapping] = useState(MAPPING_PRESETS[0].mapping);

  const isAllMode = selectedDeliverables.length === 0;
  const requiresGIS =
    isAllMode || selectedDeliverables.includes(DELIVERABLE_TYPES.GIS_EXPORT);
  const requiresSpans =
    isAllMode ||
    selectedDeliverables.some((d) =>
      [
        DELIVERABLE_TYPES.CLEARANCE_ANALYSIS,
        DELIVERABLE_TYPES.PERMIT_REPORT,
        DELIVERABLE_TYPES.FIRSTENERGY_EXPORT,
      ].includes(d),
    );
  const requiresExisting =
    isAllMode ||
    selectedDeliverables.some((d) =>
      [
        DELIVERABLE_TYPES.EXISTING_PLANT_DOC,
        DELIVERABLE_TYPES.PERMIT_REPORT,
      ].includes(d),
    );

  const withTimeout = (promise, timeoutMs, label) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timeoutId);
    });
  };

  const handlePresetChange = (value) => {
    setMappingPreset(value);
    const preset = MAPPING_PRESETS.find((p) => p.value === value);
    if (preset) setMapping(preset.mapping);
  };

  const buildPreflight = async () => {
    const errors = [];
    const warnings = [];

    if (!file) {
      errors.push({
        code: "ERR_IMP_NO_FILE",
        message: "Select a file to import.",
      });
      return { ok: false, errors, warnings };
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      errors.push({
        code: "ERR_IMP_SIZE",
        message: `File exceeds ${MAX_FILE_MB}MB limit.`,
        affectedCount: file.size,
      });
      return { ok: false, errors, warnings };
    }

    const name = (file.name || "").toLowerCase();
    if (mode === "csv") {
      if (!name.endsWith(".csv")) {
        errors.push({
          code: "ERR_IMP_FILETYPE",
          message: "CSV import requires a .csv file.",
        });
        return { ok: false, errors, warnings };
      }

      const text = await withTimeout(file.text(), PARSE_TIMEOUT_MS, "CSV read");
      const parsed = Papa.parse(text, {
        header: true,
        preview: 1,
        skipEmptyLines: "greedy",
      });
      const headers = parsed?.meta?.fields || [];
      if (!headers.length) {
        errors.push({
          code: "ERR_IMP_EMPTY",
          message: "CSV file contains no header row.",
        });
        return { ok: false, errors, warnings };
      }

      const mappingGroup =
        csvType === "lines" ? mapping?.line || {} : mapping?.[csvType] || {};
      const requiredFields = (() => {
        if (csvType === "poles") {
          const base = ["id"];
          if (requiresGIS) base.push("latitude", "longitude");
          return base;
        }
        if (csvType === "spans") {
          const base = ["id", "fromId", "toId"];
          if (requiresSpans) base.push("length");
          return base;
        }
        const base = ["type", "height"];
        return requiresExisting ? base : [];
      })();

      const missingMappings = requiredFields.filter(
        (field) => !mappingGroup?.[field],
      );
      if (missingMappings.length) {
        errors.push({
          code: "ERR_IMP_MAPPING",
          message: `Missing mapping for: ${missingMappings.join(", ")}`,
          examples: missingMappings,
        });
      }

      const missingColumns = requiredFields.filter((field) => {
        const column = mappingGroup?.[field];
        return column && !headers.includes(column);
      });
      if (missingColumns.length) {
        errors.push({
          code: "ERR_IMP_COLUMNS",
          message: `Missing required columns: ${missingColumns.join(", ")}`,
          examples: missingColumns,
        });
      }

      const mappingCheck = validateImportMapping({
        mapping: mappingGroup,
        requiredFields,
        dataType: csvType,
      });
      if (!mappingCheck.ok) {
        errors.push(...mappingCheck.errors);
      }

      if (!requiresGIS && csvType === "poles") {
        warnings.push({
          code: "WARN_IMP_GIS",
          message:
            "Latitude/longitude are optional unless GIS export is selected.",
        });
      }
    } else {
      const supported = [
        ".kml",
        ".kmz",
        ".zip",
        ".shp",
        ".dbf",
        ".geojson",
        ".json",
      ];
      if (!supported.some((ext) => name.endsWith(ext))) {
        errors.push({
          code: "ERR_IMP_FILETYPE",
          message: "Supported: KML, KMZ, GeoJSON, or Shapefile (.zip).",
        });
      }
    }

    return { ok: errors.length === 0, errors, warnings };
  };

  const handleImport = async () => {
    setStatus("");
    setPreflightResult(null);

    const preflight = await buildPreflight();
    if (!preflight.ok) {
      setPreflightResult({
        ok: false,
        errors: preflight.errors,
        warnings: preflight.warnings,
        suggestedActions: [],
      });
      setStatus("Import blocked by preflight errors.");
      return;
    }

    if (!file) return;
    setStatus("Importing...");

    try {
      if (mode === "csv") {
        const text = await withTimeout(
          file.text(),
          PARSE_TIMEOUT_MS,
          "CSV read",
        );
        const source = DATA_SOURCES.CSV_IMPORT;
        if (csvType === "poles") {
          const { data, errors } = await parsePolesCSVValidated(
            text,
            mapping?.pole,
          );
          const poles = data.map((p) =>
            normalizePoleData({ ...p, jobId: currentJobId }, source),
          );
          applyImportBatch({
            getState: useAppStore.getState,
            setState: useAppStore.setState,
            payload: { poles },
          });
          if (errors?.length) {
            setPreflightResult({
              ok: true,
              errors: [],
              warnings: errors.map((msg) => ({
                code: "WARN_ROW",
                message: msg,
              })),
              suggestedActions: [],
            });
          }
          setStatus(`Imported ${poles.length} poles.`);
          return;
        }
        if (csvType === "spans") {
          const { data, errors } = await parseSpansCSVValidated(
            text,
            mapping?.span,
          );
          const spans = data.map((s) =>
            normalizeSpanData({ ...s, jobId: currentJobId }, source),
          );
          applyImportBatch({
            getState: useAppStore.getState,
            setState: useAppStore.setState,
            payload: { spans },
          });
          if (errors?.length) {
            setPreflightResult({
              ok: true,
              errors: [],
              warnings: errors.map((msg) => ({
                code: "WARN_ROW",
                message: msg,
              })),
              suggestedActions: [],
            });
          }
          setStatus(`Imported ${spans.length} spans.`);
          return;
        }
        const lines = parseExistingLinesCSV(text, mapping?.line);
        applyImportBatch({
          getState: useAppStore.getState,
          setState: useAppStore.setState,
          payload: { existingLines: lines },
        });
        setStatus(`Imported ${lines.length} existing lines.`);
        return;
      }

      const name = (file.name || "").toLowerCase();
      const source = DATA_SOURCES.GIS_IMPORT;
      let fc;
      if (name.endsWith(".geojson") || name.endsWith(".json")) {
        const text = await withTimeout(
          file.text(),
          PARSE_TIMEOUT_MS,
          "GeoJSON read",
        );
        fc = normalizeGeoJSON(JSON.parse(text));
      } else {
        fc = await withTimeout(
          importGeospatialFile(file),
          PARSE_TIMEOUT_MS,
          "Geospatial import",
        );
      }
      const data = mapGeoJSONToAppData(fc, mapping);
      const poles = (data.poleTable || []).map((p) =>
        normalizePoleData({ ...p, jobId: currentJobId }, source),
      );
      const spans = (data.spanTable || []).map((s) =>
        normalizeSpanData({ ...s, jobId: currentJobId }, source),
      );
      const existingLines = (data.existingLines || []).map((l) => ({
        ...l,
        jobId: currentJobId,
      }));

      applyImportBatch({
        getState: useAppStore.getState,
        setState: useAppStore.setState,
        payload: { poles, spans, existingLines },
      });

      setStatus(
        `Imported ${poles.length} poles, ${spans.length} spans, ${existingLines.length} lines.`,
      );
    } catch (error) {
      setStatus(`Import failed: ${error.message || error}`);
      setPreflightResult({
        ok: false,
        errors: [
          {
            code: "ERR_IMP_RUNTIME",
            message: error.message || "Import failed",
          },
        ],
        warnings: [],
        suggestedActions: [],
      });
    }
  };

  return (
    <div data-testid="import-panel">
      <div
        className="ppp-field-group"
        style={{ marginBottom: "var(--space-4)" }}
      >
        <div className="ppp-field">
          <label className="ppp-field__label">Import Type</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            data-testid="import-mode"
          >
            <option value="geospatial">
              Geospatial (KML/KMZ/GeoJSON/Shapefile)
            </option>
            <option value="csv">CSV</option>
          </select>
        </div>

        {mode === "csv" && (
          <div className="ppp-field">
            <label className="ppp-field__label">CSV Data Type</label>
            <select
              value={csvType}
              onChange={(e) => setCsvType(e.target.value)}
              data-testid="import-csv-type"
            >
              <option value="poles">Poles</option>
              <option value="spans">Spans</option>
              <option value="lines">Existing Lines</option>
            </select>
          </div>
        )}

        <div className="ppp-field">
          <label className="ppp-field__label">Mapping Preset</label>
          <select
            value={mappingPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            data-testid="import-mapping-preset"
          >
            {MAPPING_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="ppp-field-group"
        style={{ marginBottom: "var(--space-4)" }}
      >
        <div className="ppp-field">
          <label className="ppp-field__label">File</label>
          <input
            type="file"
            accept={
              mode === "csv"
                ? ".csv"
                : ".kml,.kmz,.zip,.shp,.dbf,.geojson,.json"
            }
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            data-testid="import-file"
          />
        </div>
        <div className="ppp-field" style={{ alignSelf: "flex-end" }}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleImport}
            disabled={!file}
            data-testid="import-submit"
          >
            Import
          </Button>
        </div>
      </div>

      {status && (
        <div className="ppp-info-banner" data-testid="import-status">
          {status}
        </div>
      )}

      {preflightResult && (
        <div style={{ marginTop: "var(--space-4)" }}>
          <PreflightCheckPanel
            title={
              preflightResult.ok ? "Import Warnings" : "Import Preflight Failed"
            }
            result={preflightResult}
            testId="import-preflight-panel"
          />
        </div>
      )}
    </div>
  );
}
