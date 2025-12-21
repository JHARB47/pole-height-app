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
import { logExportSuccess, logExportError } from "../../../utils/telemetry";

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
  } = useAppStore(
    useShallow((s) => ({
      currentJobId: s.currentJobId,
      projectName: s.projectName,
      collectedPoles: s.collectedPoles || [],
      importedSpans: s.importedSpans || [],
      existingLines: s.existingLines || [],
      analysis: s.analysis,
    })),
  );

  const [exporting, setExporting] = React.useState(null);
  const [exportError, setExportError] = React.useState(null);

  const hasData = collectedPoles.length > 0 || importedSpans.length > 0;
  const doneCount = collectedPoles.filter((p) => p.status === "done").length;
  const totalPoles = collectedPoles.length;

  const handleExport = async (format, filename) => {
    // Guard against rapid double-clicks on the same export type
    if (exporting === format) return;

    setExporting(format);
    setExportError(null);
    const startTime = performance.now();

    try {
      const data = { collectedPoles, importedSpans, existingLines };
      const result = await exportData(format, data);
      const durationMs = performance.now() - startTime;

      // Trigger download
      const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
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

  if (!currentJobId) {
    return (
      <div className="ppp-main-content">
        <div className="ppp-panel-header">
          <div className="ppp-panel-header__title">
            <span className="ppp-panel-header__step-badge">6</span>
            <h1>Outputs</h1>
          </div>
        </div>
        <div className="ppp-empty-state">
          <svg
            className="ppp-empty-state__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <h3 className="ppp-empty-state__title">No Job Selected</h3>
          <p className="ppp-empty-state__description">
            Select or create a job in Project Setup first.
          </p>
        </div>
      </div>
    );
  }

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

      {/* Summary */}
      <Card>
        <CardHeader>
          <span>Project Summary</span>
        </CardHeader>
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
        <CardHeader step={6}>
          <span>Export Data</span>
        </CardHeader>
        <CardBody>
          {!hasData ? (
            <div
              className="ppp-empty-state"
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
                >
                  {exportError}
                </div>
              )}
              <div className="ppp-data-grid">
                <div
                  className="ppp-data-item"
                  style={{
                    cursor: exporting === "poles-csv" ? "wait" : "pointer",
                  }}
                  onClick={() =>
                    handleExport("poles-csv", `${projectName || "poles"}.csv`)
                  }
                >
                  <span className="ppp-data-item__label">Poles CSV</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exporting === "poles-csv"}
                  >
                    {exporting === "poles-csv" ? (
                      <>
                        <span className="ppp-spinner" aria-hidden="true" />{" "}
                        Exporting...
                      </>
                    ) : (
                      "Download"
                    )}
                  </Button>
                </div>
                <div
                  className="ppp-data-item"
                  style={{
                    cursor: exporting === "spans-csv" ? "wait" : "pointer",
                  }}
                  onClick={() =>
                    handleExport(
                      "spans-csv",
                      `${projectName || "spans"}_spans.csv`,
                    )
                  }
                >
                  <span className="ppp-data-item__label">Spans CSV</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      exporting === "spans-csv" || importedSpans.length === 0
                    }
                  >
                    {exporting === "spans-csv" ? (
                      <>
                        <span className="ppp-spinner" aria-hidden="true" />{" "}
                        Exporting...
                      </>
                    ) : (
                      "Download"
                    )}
                  </Button>
                </div>
                <div
                  className="ppp-data-item"
                  style={{
                    cursor: exporting === "existing-csv" ? "wait" : "pointer",
                  }}
                  onClick={() =>
                    handleExport(
                      "existing-csv",
                      `${projectName || "existing"}_lines.csv`,
                    )
                  }
                >
                  <span className="ppp-data-item__label">
                    Existing Lines CSV
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      exporting === "existing-csv" || existingLines.length === 0
                    }
                  >
                    {exporting === "existing-csv" ? (
                      <>
                        <span className="ppp-spinner" aria-hidden="true" />{" "}
                        Exporting...
                      </>
                    ) : (
                      "Download"
                    )}
                  </Button>
                </div>
                <div
                  className="ppp-data-item"
                  style={{
                    cursor: exporting === "geojson" ? "wait" : "pointer",
                  }}
                  onClick={() =>
                    handleExport(
                      "geojson",
                      `${projectName || "project"}.geojson`,
                    )
                  }
                >
                  <span className="ppp-data-item__label">GeoJSON</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exporting === "geojson"}
                  >
                    {exporting === "geojson" ? (
                      <>
                        <span className="ppp-spinner" aria-hidden="true" />{" "}
                        Exporting...
                      </>
                    ) : (
                      "Download"
                    )}
                  </Button>
                </div>
                <div
                  className="ppp-data-item"
                  style={{ cursor: exporting === "kml" ? "wait" : "pointer" }}
                  onClick={() =>
                    handleExport("kml", `${projectName || "project"}.kml`)
                  }
                >
                  <span className="ppp-data-item__label">
                    KML (Google Earth)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exporting === "kml"}
                  >
                    {exporting === "kml" ? (
                      <>
                        <span className="ppp-spinner" aria-hidden="true" />{" "}
                        Exporting...
                      </>
                    ) : (
                      "Download"
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Permit Generation */}
      <Card>
        <CardHeader>
          <span>Generate Permit Package</span>
        </CardHeader>
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
          <Button variant="primary" disabled={!hasData}>
            Generate Permit PDF
          </Button>
        </CardBody>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <span>Clearance Analysis Results</span>
          </CardHeader>
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
