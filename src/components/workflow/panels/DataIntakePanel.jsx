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
  const { importedSpans, collectedPoles, currentJobId } = useAppStore(
    useShallow((s) => ({
      importedSpans: s.importedSpans || [],
      collectedPoles: s.collectedPoles || [],
      currentJobId: s.currentJobId,
    })),
  );

  const totalPoles =
    collectedPoles.length +
    (importedSpans.length > 0 ? importedSpans.length : 0);

  if (!currentJobId) {
    return (
      <div className="ppp-main-content">
        <div className="ppp-panel-header">
          <div className="ppp-panel-header__title">
            <span className="ppp-panel-header__step-badge">2</span>
            <h1>Data Intake</h1>
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
            Select or create a job in Project Setup to import data.
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
