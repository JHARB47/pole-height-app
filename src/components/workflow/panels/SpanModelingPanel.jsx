/**
 * SpanModelingPanel - Span & Clearance Modeling step panel.
 * Wraps span editor and clearance calculations.
 */
import React from "react";
import useAppStore from "../../../utils/store";
import { useShallow } from "zustand/react/shallow";
import { Card, CardHeader, CardBody } from "../../ui";
import { StatusBadge } from "../../ui";

// Lazy load span-related components
const SpansEditor = React.lazy(() => import("../../SpansEditor"));
const SpanDiagram = React.lazy(() => import("../../SpanDiagram"));

export default function SpanModelingPanel() {
  const { importedSpans, currentJobId, analysis } = useAppStore(
    useShallow((s) => ({
      importedSpans: s.importedSpans || [],
      currentJobId: s.currentJobId,
      analysis: s.analysis,
    })),
  );

  const passCount = importedSpans.filter((s) => s.status === "PASS").length;
  const failCount = importedSpans.filter((s) => s.status === "FAIL").length;
  const totalSpans = importedSpans.length;

  if (!currentJobId) {
    return (
      <div className="ppp-main-content">
        <div className="ppp-panel-header">
          <div className="ppp-panel-header__title">
            <span className="ppp-panel-header__step-badge">4</span>
            <h1>Span & Clearance Modeling</h1>
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
          <span className="ppp-panel-header__step-badge">4</span>
          <h1>Span & Clearance Modeling</h1>
        </div>
        {totalSpans > 0 && (
          <div className="ppp-panel-header__actions">
            <StatusBadge status={failCount > 0 ? "fail" : "pass"}>
              {failCount > 0 ? `${failCount} Fail` : "All Pass"}
            </StatusBadge>
          </div>
        )}
      </div>

      {/* Summary */}
      {totalSpans > 0 && (
        <div className="ppp-data-grid">
          <div className="ppp-data-item">
            <span className="ppp-data-item__label">Total Spans</span>
            <span className="ppp-data-item__value">{totalSpans}</span>
          </div>
          <div className="ppp-data-item">
            <span className="ppp-data-item__label">Passing</span>
            <span className="ppp-data-item__value ppp-data-item__value--pass">
              {passCount}
            </span>
          </div>
          <div className="ppp-data-item">
            <span className="ppp-data-item__label">Failing</span>
            <span
              className={`ppp-data-item__value ${failCount > 0 ? "ppp-data-item__value--fail" : ""}`}
            >
              {failCount}
            </span>
          </div>
        </div>
      )}

      {/* Span Diagram Preview */}
      {totalSpans > 0 && (
        <Card>
          <CardHeader>
            <span>Clearance Diagram</span>
          </CardHeader>
          <CardBody>
            <React.Suspense
              fallback={
                <div className="ppp-loading">
                  <div className="ppp-loading__spinner" />
                  <span>Loading diagram...</span>
                </div>
              }
            >
              <div style={{ height: 200, overflow: "hidden" }}>
                <SpanDiagram />
              </div>
            </React.Suspense>
          </CardBody>
        </Card>
      )}

      {/* Spans Editor */}
      <Card>
        <CardHeader step={4}>
          <span>Span Data</span>
        </CardHeader>
        <CardBody>
          {totalSpans === 0 ? (
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
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
              <h3 className="ppp-empty-state__title">No Spans Yet</h3>
              <p className="ppp-empty-state__description">
                Import pole data in the Data Intake step, or add spans manually
                below.
              </p>
            </div>
          ) : (
            <React.Suspense
              fallback={
                <div className="ppp-loading">
                  <div className="ppp-loading__spinner" />
                  <span>Loading span editor...</span>
                </div>
              }
            >
              <SpansEditor />
            </React.Suspense>
          )}
        </CardBody>
      </Card>

      {/* Analysis Summary */}
      {analysis && (
        <Card>
          <CardHeader>
            <span>Clearance Analysis</span>
          </CardHeader>
          <CardBody>
            <div className="ppp-data-grid">
              <div className="ppp-data-item">
                <span className="ppp-data-item__label">Minimum Clearance</span>
                <span
                  className={`ppp-data-item__value ${analysis.minClearance < 18 ? "ppp-data-item__value--fail" : "ppp-data-item__value--pass"}`}
                >
                  {analysis.minClearance?.toFixed(1) || "--"} ft
                </span>
              </div>
              <div className="ppp-data-item">
                <span className="ppp-data-item__label">Required Clearance</span>
                <span className="ppp-data-item__value">
                  {analysis.requiredClearance?.toFixed(1) || "18.0"} ft
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
