/**
 * DataIntakePanel - Data Intake step panel.
 * Wraps import functionality and field mapping.
 */
import React from "react";
import useAppStore from "../../../utils/store";
import { useShallow } from "zustand/react/shallow";
import { Card, CardHeader, CardBody } from "../../ui";
import { Button } from "../../ui";

// Lazy load the actual import panel
const LazyImportPanel = React.lazy(() => import("../../LazyImportPanel"));

export default function DataIntakePanel() {
  const { importedSpans, collectedPoles, currentJobId, workflowRequirements } =
    useAppStore(
      useShallow((s) => ({
        importedSpans: s.importedSpans || [],
        collectedPoles: s.collectedPoles || [],
        currentJobId: s.currentJobId,
        workflowRequirements: s.workflowRequirements,
      })),
    );

  const totalPoles =
    collectedPoles.length +
    (importedSpans.length > 0 ? importedSpans.length : 0);

  const isOptional = workflowRequirements?.requiredSteps?.dataIntake === false;

  const handleSkip = () => {
    // AI: rationale — optional steps should be skippable without blocking outputs.
    window.dispatchEvent(
      new CustomEvent("ppp:skip-step", { detail: { stepId: "data-intake" } }),
    );
  };

  return (
    <div className="ppp-main-content">
      {/* Panel Header */}
      <div className="ppp-panel-header">
        <div className="ppp-panel-header__title">
          <span className="ppp-panel-header__step-badge">2</span>
          <h1>Data Intake</h1>
        </div>
        {totalPoles > 0 && (
          <div className="ppp-panel-header__actions">
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {totalPoles} pole{totalPoles !== 1 ? "s" : ""} loaded
            </span>
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
            <strong>Tip:</strong> Create a job in Project Setup to save imported
            data to a project.
          </span>
        </div>
      )}

      {isOptional && (
        <div
          className="ppp-info-banner"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-3) var(--space-4)",
            backgroundColor: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-4)",
          }}
        >
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            This step is optional for your selected deliverables.
          </span>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip for now
          </Button>
        </div>
      )}

      {/* Summary if data exists */}
      {totalPoles > 0 && (
        <div className="ppp-data-grid">
          <div className="ppp-data-item">
            <span className="ppp-data-item__label">Imported Spans</span>
            <span className="ppp-data-item__value">{importedSpans.length}</span>
          </div>
          <div className="ppp-data-item">
            <span className="ppp-data-item__label">Collected Poles</span>
            <span className="ppp-data-item__value">
              {collectedPoles.length}
            </span>
          </div>
        </div>
      )}

      {/* Import Panel */}
      <Card>
        <CardHeader step={2}>
          <span>Import Data</span>
        </CardHeader>
        <CardBody>
          <React.Suspense
            fallback={
              <div className="ppp-loading">
                <div className="ppp-loading__spinner" />
                <span>Loading import tools...</span>
              </div>
            }
          >
            <LazyImportPanel />
          </React.Suspense>
        </CardBody>
      </Card>

      {/* Format Help */}
      <Card>
        <CardHeader>
          <span>Supported Formats</span>
        </CardHeader>
        <CardBody>
          <div className="ppp-data-grid">
            <div className="ppp-data-item">
              <span className="ppp-data-item__label">CSV</span>
              <span
                className="ppp-data-item__value"
                style={{ fontSize: "0.875rem", fontWeight: 400 }}
              >
                Katapult Pro, ikeGPS, ArcGIS exports
              </span>
            </div>
            <div className="ppp-data-item">
              <span className="ppp-data-item__label">GeoJSON / KML</span>
              <span
                className="ppp-data-item__value"
                style={{ fontSize: "0.875rem", fontWeight: 400 }}
              >
                Geospatial point data with attributes
              </span>
            </div>
            <div className="ppp-data-item">
              <span className="ppp-data-item__label">Shapefile</span>
              <span
                className="ppp-data-item__value"
                style={{ fontSize: "0.875rem", fontWeight: 400 }}
              >
                .shp + .dbf + .prj bundle (zip or folder)
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
