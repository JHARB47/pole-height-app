/**
 * OutputsPanel - Outputs step panel.
 * Wraps report generation and export functionality.
 */
import React from "react";
import useAppStore from "../../../utils/store";
import { useShallow } from "zustand/react/shallow";
import { Card, CardHeader, CardBody } from "../../ui";
import { Button, StatusBadge } from "../../ui";
import PropTypes from "prop-types";
import {
  logExportSuccess,
  logExportError,
  logExportStarted,
  logValidationFailed,
} from "../../../utils/telemetry";
import PreflightCheckPanel from "../../PreflightCheckPanel";
import {
  validateForExportType,
  getExportDeliverable,
} from "../../../utils/preflightValidation";

// Import exporters dynamically to keep bundle small
const exportData = async (format, data) => {
  const exporters = await import("../../../utils/exporters");
  switch (format) {
    case "poles-csv":
      return exporters.buildPolesCSV(data.collectedPoles);
    case "spans-csv":
      return exporters.buildSpansCSV(data.importedSpans);
    case "existing-csv":
      return exporters.buildExistingLinesCSV(data.existingLines);
    case "geojson":
      return exporters.buildGeoJSON(data);
    case "kml":
      return exporters.buildKML(data);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
};

export default function OutputsPanel({ toast }) {
  const {
    currentJobId,
    projectName,
    collectedPoles,
    importedSpans,
    existingLines,
    analysis,
    isDeliverableSelected,
  } = useAppStore(
    useShallow((s) => ({
      currentJobId: s.currentJobId,
      projectName: s.projectName,
      collectedPoles: s.collectedPoles || [],
      importedSpans: s.importedSpans || [],
      existingLines: s.existingLines || [],
      analysis: s.analysis,
      isDeliverableSelected: s.isDeliverableSelected,
    })),
  );

  const [exporting, setExporting] = React.useState(null);
  const [exportError, setExportError] = React.useState(null);
  const [preflightResult, setPreflightResult] = React.useState(null);
  const [preflightTitle, setPreflightTitle] = React.useState(null);

  const hasData = collectedPoles.length > 0 || importedSpans.length > 0;
  const doneCount = collectedPoles.filter((p) => p.status === "done").length;
  const totalPoles = collectedPoles.length;

  const exportOptions = [
    {
      id: "poles-csv",
      label: "Poles CSV",
      filename: `${projectName || "poles"}.csv`,
      disabled: collectedPoles.length === 0,
    },
    {
      id: "spans-csv",
      label: "Spans CSV",
      filename: `${projectName || "spans"}_spans.csv`,
      disabled: importedSpans.length === 0,
    },
    {
      id: "existing-csv",
      label: "Existing Lines CSV",
      filename: `${projectName || "existing"}_lines.csv`,
      disabled: existingLines.length === 0,
    },
    {
      id: "geojson",
      label: "GeoJSON",
      filename: `${projectName || "project"}.geojson`,
      disabled: false,
    },
    {
      id: "shapefile",
      label: "Shapefile (ZIP)",
      filename: `${projectName || "project"}-shapefile.zip`,
      disabled: false,
    },
    {
      id: "kml",
      label: "KML (Google Earth)",
      filename: `${projectName || "project"}.kml`,
      disabled: false,
    },
  ];

  const filteredExportOptions = exportOptions.filter((option) => {
    const deliverable = getExportDeliverable(option.id);
    return deliverable ? isDeliverableSelected(deliverable) : true;
  });

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

  const handleExport = async (format, filename) => {
    // Guard against rapid double-clicks on the same export type
    if (exporting === format) return;

    setExporting(format);
    setExportError(null);
    setPreflightResult(null);
    setPreflightTitle(null);
    const startTime = performance.now();

    try {
      const preflight = validateForExportType(useAppStore.getState(), format);
      if (!preflight.ok) {
        // AI: rationale — block export when required fields are missing and surface actionable errors.
        setPreflightResult(preflight);
        setPreflightTitle("Export Preflight Failed");
        logValidationFailed({
          scope: "export",
          codes: preflight.errors.map((e) => e.code),
          exportType: format,
        });
        toast?.error("Export blocked: missing required fields");
        return;
      }

      logExportStarted({ format });
      const data = { collectedPoles, importedSpans, existingLines };
      if (format === "shapefile") {
        const { buildGeoJSON, exportShapefile } =
          await import("../../../utils/geodata");
        const fc = buildGeoJSON({
          poles: collectedPoles,
          spans: importedSpans,
          job: { id: currentJobId, name: projectName },
        });
        const shpBlob = await withTimeout(
          exportShapefile(fc, filename, false),
          15000,
          "Export",
        );
        const isGeoFallback = shpBlob?.type === "application/json";
        const downloadName = isGeoFallback
          ? filename.replace(/\.zip$/i, ".geojson")
          : filename;

        const url = URL.createObjectURL(shpBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const durationMs = performance.now() - startTime;
        const itemCount =
          collectedPoles.length + importedSpans.length + existingLines.length;
        logExportSuccess({ format, itemCount, durationMs });
        toast?.success(`Exported ${downloadName} successfully`);
        return;
      }

      const result = await withTimeout(
        exportData(format, data),
        15000,
        "Export",
      );
      const durationMs = performance.now() - startTime;

      // Trigger download
      const blob =
        result instanceof Blob
          ? result
          : new Blob([result], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Telemetry: log export success
      const itemCount =
        collectedPoles.length + importedSpans.length + existingLines.length;
      logExportSuccess({ format, itemCount, durationMs });

      // Toast success feedback
      toast?.success(`Exported ${filename} successfully`);
    } catch (err) {
      const durationMs = performance.now() - startTime;
      console.error("Export failed:", err);
      // Handle non-Error throws (strings, objects, etc.)
      const errorMsg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Export failed";

      // Telemetry: log export error
      logExportError({ format, errorMessage: errorMsg, durationMs });

      setExportError(errorMsg);
      toast?.error(`Export failed: ${errorMsg}`);
    } finally {
      setExporting(null);
    }
  };

  const handlePermitGenerate = async () => {
    const preflight = validateForExportType(
      useAppStore.getState(),
      "permit-pdf",
    );

    if (!preflight.ok) {
      setPreflightResult(preflight);
      setPreflightTitle("Permit Preflight Failed");
      logValidationFailed({
        scope: "permit",
        codes: preflight.errors.map((e) => e.code),
      });
      toast?.error("Permit generation blocked: missing required fields");
      return;
    }

    toast?.info("Permit PDF generation is not configured yet.");
  };

  return (
    <div className="ppp-main-content">
      {/* Panel Header */}
      <div className="ppp-panel-header">
        <div className="ppp-panel-header__title">
          <span className="ppp-panel-header__step-badge">6</span>
          <h1>Outputs</h1>
        </div>
        {hasData && (
          <div className="ppp-panel-header__actions">
            <StatusBadge
              status={
                doneCount === totalPoles && totalPoles > 0 ? "done" : "draft"
              }
            >
              {doneCount === totalPoles && totalPoles > 0
                ? "Ready to Export"
                : "In Progress"}
            </StatusBadge>
          </div>
        )}
      </div>

      {/* Info banner when no job selected */}
      {!currentJobId && (
        <div
          className="ppp-info-banner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-3) var(--space-4)",
            backgroundColor: "var(--blue-50, #eff6ff)",
            border: "1px solid var(--blue-200, #bfdbfe)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-4)",
            color: "var(--blue-800, #1e40af)",
            fontSize: "0.875rem",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>
            <strong>Tip:</strong> Create a job in Project Setup to organize
            exports by project.
          </span>
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardHeader title="Project Summary" />
        <CardBody>
          <div className="ppp-data-grid">
            <div className="ppp-data-item">
              <span className="ppp-data-item__label">Project</span>
              <span
                className="ppp-data-item__value"
                style={{ fontSize: "0.9375rem" }}
              >
                {projectName || "Untitled"}
              </span>
            </div>
            <div className="ppp-data-item">
              <span className="ppp-data-item__label">Poles</span>
              <span className="ppp-data-item__value">
                {collectedPoles.length + importedSpans.length}
              </span>
            </div>
            <div className="ppp-data-item">
              <span className="ppp-data-item__label">Spans</span>
              <span className="ppp-data-item__value">
                {importedSpans.length}
              </span>
            </div>
            <div className="ppp-data-item">
              <span className="ppp-data-item__label">Existing Attachments</span>
              <span className="ppp-data-item__value">
                {existingLines.length}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader title="Export Data" stepNumber={6} />
        <CardBody>
          {!hasData ? (
            <div
              className="ppp-empty-state"
              data-testid="missing-data-warning"
              style={{ background: "transparent", border: "none" }}
            >
              <svg
                className="ppp-empty-state__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <h3 className="ppp-empty-state__title">No Data to Export</h3>
              <p className="ppp-empty-state__description">
                Import or collect pole data before exporting.
              </p>
            </div>
          ) : (
            <>
              {exportError && (
                <div
                  style={{
                    padding: "var(--space-3)",
                    marginBottom: "var(--space-4)",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid var(--danger)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--danger)",
                    fontSize: "0.875rem",
                  }}
                  data-testid="export-error"
                >
                  {exportError}
                </div>
              )}
              {preflightResult && (
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <PreflightCheckPanel
                    title={preflightTitle}
                    result={preflightResult}
                    testId="preflight-panel"
                  />
                </div>
              )}
              {filteredExportOptions.length === 0 ? (
                <div
                  className="ppp-empty-state"
                  data-testid="no-exports-required"
                  style={{ background: "transparent", border: "none" }}
                >
                  <h3 className="ppp-empty-state__title">
                    No exports required
                  </h3>
                  <p className="ppp-empty-state__description">
                    Your selected deliverables do not require data exports.
                  </p>
                </div>
              ) : (
                <div className="ppp-data-grid" data-testid="export-options">
                  {filteredExportOptions.map((option) => (
                    <div
                      key={option.id}
                      className="ppp-data-item"
                      style={{
                        cursor: exporting === option.id ? "wait" : "pointer",
                      }}
                      onClick={() => handleExport(option.id, option.filename)}
                      data-testid={`export-item-${option.id}`}
                    >
                      <span className="ppp-data-item__label">
                        {option.label}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={exporting === option.id || option.disabled}
                        data-testid={`export-button-${option.id}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleExport(option.id, option.filename);
                        }}
                      >
                        {exporting === option.id ? (
                          <>
                            <span className="ppp-spinner" aria-hidden="true" />{" "}
                            Exporting...
                          </>
                        ) : (
                          "Download"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Permit Generation */}
      {isDeliverableSelected("permit_report") && (
        <Card>
          <CardHeader title="Generate Permit Package" />
          <CardBody>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.875rem",
                marginBottom: "var(--space-4)",
              }}
            >
              Generate a complete permit application package including clearance
              analysis, make-ready summary, and attachment diagrams.
            </p>
            <Button
              variant="primary"
              disabled={!hasData}
              onClick={handlePermitGenerate}
            >
              Generate Permit PDF
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && isDeliverableSelected("clearance_analysis") && (
        <Card>
          <CardHeader title="Clearance Analysis Results" />
          <CardBody>
            <div className="ppp-data-grid">
              <div className="ppp-data-item">
                <span className="ppp-data-item__label">Overall Status</span>
                <StatusBadge
                  status={analysis.status === "PASS" ? "pass" : "fail"}
                >
                  {analysis.status || "--"}
                </StatusBadge>
              </div>
              <div className="ppp-data-item">
                <span className="ppp-data-item__label">Min Clearance</span>
                <span
                  className={`ppp-data-item__value ${(analysis.minClearance || 0) < 18 ? "ppp-data-item__value--fail" : "ppp-data-item__value--pass"}`}
                >
                  {analysis.minClearance?.toFixed(2) || "--"} ft
                </span>
              </div>
              <div className="ppp-data-item">
                <span className="ppp-data-item__label">Max Sag</span>
                <span className="ppp-data-item__value">
                  {analysis.maxSag?.toFixed(2) || "--"} ft
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

OutputsPanel.propTypes = {
  toast: PropTypes.shape({
    success: PropTypes.func,
    error: PropTypes.func,
    warning: PropTypes.func,
    info: PropTypes.func,
  }),
};
